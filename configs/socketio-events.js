module.exports = function (io, User, sessionMiddleware, passport) {
    // convert a connect middleware to a Socket.IO middleware
    const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
    io.use(wrap(sessionMiddleware));
    io.use(wrap(passport.initialize()));
    io.use(wrap(passport.session()));
    io.use((socket, next) => {
        if (socket.request.user) {
            socket.userid = socket.request.user._id;
            next();
        } else {
            next(new Error('unauthorized'))
        }
    });
    
    // save online users, key=userid
    let statusMap = new Map();

    io.on('connection', (socket) => {
        /* send chats */

        User.findById( socket.userid, 'chats unread order', function(err, userData){
            if(err){
                logger.error(err);
            } else {
                // set online status
                statusMap.set(socket.userid, true);
                let onlineUsers = [];

                if (userData.order) {
                    for (let i = 0; i <userData.order.length; i++) {
                        if (statusMap.get(String(userData.order[i]))) {
                            onlineUsers.push(userData.order[i])
                        }
                    }
                }

                socket.username = socket.request.user.fullName;
                socket.emit("my chats", userData.chats, userData.unread, userData.order, onlineUsers);
                socket.broadcast.emit("userConnected", socket.userid);
                // console.log(JSON.stringify(userData.chats, null, 2));
            }
        }).lean();

        /* join room */
        socket.join(socket.userid);

        /* seperate msg */
        socket.on("private message", ({ content, to }) => {
            const sender = socket.userid;
            const temp = new Date().toLocaleString("en-US", { timeZone: 'Asia/Kolkata' });
            const timestamp = temp.slice(0, -6) + " " + temp.slice(-2);

            User.findByIdAndUpdate( sender, {
                "$pull": {
                    "order": to
                },
                "$push": {
                    "chats.$[a].messages": {
                        who: 0,
                        msg: content,
                        timestamp: timestamp
                    }
                }
            },
            {
                arrayFilters: [
                    {"a.userid": to}
                ]
            },
            function(err){
                if (err)
                    logger.error(err);
                else {
                    // put at position 1
                    User.findByIdAndUpdate(sender, {
                        "$push": {
                            "order": {
                                $each: [to],
                                $position: 0
                            }
                        }
                    }, function(err) {
                        if (err)
                            logger.error(err);
                        else {
                            User.findByIdAndUpdate( to, {
                                "$pull": {
                                    "order": sender
                                },
                                "$push": {
                                    "chats.$[a].messages": {
                                        who: 1,
                                        msg: content,
                                        timestamp: timestamp
                                    }
                                }
                            },
                            {
                                arrayFilters: [
                                    {"a.userid": sender}
                                ]
                            },
                            function(err){
                                if (err)
                                    logger.error(err);
                                else {
                                        // change order
                                        User.findByIdAndUpdate(to, {
                                            "$push": {
                                                "order": {
                                                    $each: [sender],
                                                    $position: 0
                                                }
                                            }
                                        }, function (err) {
                                            if (err)
                                                logger.error(err);
                                            else {
                                                // send to receiver
                                                socket.to(to).emit("private message", {
                                                    content,
                                                    from: {
                                                    userid: sender,
                                                    username: socket.username
                                                    },
                                                    timestamp
                                                });
                                                
                                                // add to unread
                                                (async function() {
                                                    const matchingSockets = await io.in(to).allSockets();
                                                    const isDisconnected = matchingSockets.size === 0;
                                                    if(isDisconnected) {
                                                        User.findByIdAndUpdate(to, 
                                                        {
                                                            "$push": {
                                                                "unread": sender
                                                            }
                                                        },
                                                        function(err) {
                                                            if(err) {
                                                                logger.error(err)
                                                            }
                                                        });
                                                    }
                                                })();
                                            }
                                        });

        
                                    }
                            });
                        }
                    });

                }
            });

        });

        socket.on("removeUnread", (userToRemove) => {
            User.findByIdAndUpdate(socket.userid, 
                {
                    "$pull": {
                        "unread": userToRemove
                    }
                },
                function(err) {
                    if(err) {
                        logger.error(err)
                    }
                });
        });

        socket.on("addUnread", (userToAdd) => {
            User.findByIdAndUpdate(socket.userid,
                {
                    "$push": {
                        "unread": userToAdd
                    }
                },
                function (err, data) {
                    if (err) {
                        logger.error(err)
                    }
                });
        });

        socket.on("deleteChat", (userid) => {
            User.findByIdAndUpdate(socket.userid, 
            {
                $pull: {
                    chats: { userid: userid },
                    order: userid
                }
            }, 
            function (err, data) {
                if (err) {
                    logger.error(err)
                } else {
                    console.log(data)
                }
            });
        });

        socket.on("clearChat", (userid) => {
            User.findByIdAndUpdate(socket.userid,
            {
                "$set": {
                    "chats.$[a].messages": []
                }
            },
            {
                arrayFilters: [
                    { "a.userid": userid }
                ]
                }, function (err) {
                    if (err) {
                        logger.error(err)
                    }
            });
        });

        // socket.on("askOnlineStatus", (userid) => {
        //     const temp = statusMap.get(userid);
        //     socket.to(socket.userid).emit("giveOnlineStatus", { userid, temp });
        // });

        socket.on("disconnect", async function () {
            const matchingSockets = await io.in(socket.userid).allSockets();
            const isDisconnected = matchingSockets.size === 0;
            if (isDisconnected) {
                // set offline status
                statusMap.set(socket.userid, false);

                // broadcast online status
                socket.broadcast.emit("userDisconnected", socket.userid);
            }
        });
    });
}