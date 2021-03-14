const express = require("express");
const router = express.Router();

const User  = require("../models/user");

const allMiddlewares = require("../middleware/index.js");

router.get('/chats', allMiddlewares.rejectAdmin, function(req, res) {
    res.render('chats');
});

router.get('/chats/:id', allMiddlewares.rejectAdmin, function(req, res) {
    const currentUser = req.user._id;
    const currentUserName = req.user.fullName;
    const receiver = req.params.id;

    /* new chat */
    if (currentUser != receiver && req.user.role != "admin") {
        User.findById( receiver, 'firstName lastName', function(err, receiverData) {
            if(err) {
                console.log(err);
                res.redirect('/communicate');
            } else {
                const receiverFullName = receiverData.firstName + " " + receiverData.lastName;
                

                User.findOneAndUpdate( {
                    _id: currentUser,
                    'chats.userid': { $ne: receiver}
                }, 
                {
                    "$push": {
                        "chats": {
                                userid: receiver,
                                username: receiverFullName,
                                messages: []
                            }
                    }
                },
                function(err, changes){
                    if (err) {
                        console.log(err);
                        res.redirect('/communicate');
                    }
                    else if (changes != null){
                        User.findByIdAndUpdate( receiver, {
                            "$push": {
                                "chats": {
                                        userid: currentUser,
                                        username: currentUserName,
                                        messages: []
                                    }
                            }
                        },
                        function(err){
                            if (err)
                                console.log(err);
                            else {
                                res.redirect('/chats');
                            }
                        });
                    } else {
                        res.redirect('/chats');
                    }
                });

            }
        }).lean();
    } else {
        res.redirect('/communicate');
    }
});

module.exports = router;