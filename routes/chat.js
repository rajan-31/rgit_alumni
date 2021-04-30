const express = require("express");
const router = express.Router();
const mongoose = require("mongoose")

const User  = require("../models/user");

const allMiddlewares = require("../middleware/index.js");
const logger = require("../configs/winston_config");

router.get('/chats', allMiddlewares.rejectAdmin, function(req, res) {
    res.render('chats');
});

router.get('/chats/:id', allMiddlewares.rejectAdmin, function(req, res) {
    const currentUser = req.user._id;
    const currentUserName = req.user.fullName;
    let receiver;
    try {
        receiver = mongoose.Types.ObjectId(req.params.id);

        /* new chat */
        if (currentUser != receiver && req.user.role != "admin") {
            User.findById( receiver, 'firstName lastName', function(err, receiverData) {
                if(err) {
                    logger.error(err);
                    res.redirect('/communicate');
                } else {
                    const receiverFullName = receiverData.firstName + " " + receiverData.lastName;
                    
                    // 'chats.userid': { $ne: receiver} // no duplicate insertion
                    User.findOneAndUpdate( {
                        _id: currentUser,
                        'chats.userid': { $ne: receiver}
                    }, 
                    {
                        "$push": {
                            "chats": {
                                $each: [
                                    {
                                        userid: receiver,
                                        username: receiverFullName,
                                        messages: []
                                    }
                                ],
                                $position: 0
                            },
                            "order": {
                                $each: [receiver],
                                $position: 0
                            }
                        }
                    },
                    function(err, changes){
                        if (err) {
                            logger.error(err);
                            res.redirect('/communicate');
                        }
                        else if (changes != null){
                            User.findByIdAndUpdate( receiver, {
                                "$push": {
                                    "chats": {
                                        $each: [
                                            {
                                                userid: currentUser,
                                                username: currentUserName,
                                                messages: []
                                            }
                                        ],
                                        $position: 0
                                    },
                                    "order": {
                                        $each: [currentUser],
                                        $position: 0
                                    }
                                }
                            },
                            function(err){
                                if (err)
                                    logger.error(err);
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
    } catch (error) {
        logger.error("Invalid chat ID");
        req.flash("errorMessage", "Invalid profile ID, please try again.");
        res.redirect('/communicate');
    }

});

module.exports = router;