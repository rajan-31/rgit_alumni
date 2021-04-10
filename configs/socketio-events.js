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

    io.on('connection', (socket) => {
        /* send chats */
        User.findById( socket.request.user._id, 'chats unread', function(err, userData){
            if(err){
                logger.error(err);
            } else {
                socket.username = socket.request.user.fullName;
                socket.emit("my chats", userData.chats, userData.unread);
                // console.log(JSON.stringify(userData.chats, null, 2));
            }
        }).lean();

        /* join room */
        socket.join(socket.request.user._id);

        /* seperate msg */
        socket.on("private message", ({ content, to }) => {
            const sender = socket.request.user._id;
            
            User.findByIdAndUpdate( sender, {
                "$push": {
                    "chats.$[a].messages": {
                        who: 0,
                        msg: content
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
                    logger.error(err)
                else {
                    User.findByIdAndUpdate( to, {
                        "$push": {
                            "chats.$[a].messages": {
                                who: 1,
                                msg: content
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
                            logger.error(err)
                        else {
                            // send to receiver
                            socket.to(to).emit("private message", {
                                content,
                                from: {
                                userid: sender,
                                username: socket.username
                                }
                            });
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

    });
}