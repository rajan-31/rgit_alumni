const express = require("express"),
router = express.Router(),
mongoose = require("mongoose"),
sharp = require("sharp");
sharp.cache = false;

const User = require("../models/user");

const allMiddlewares = require('../middleware/index.js');
const logger = require("../configs/winston_config");

/* Multer config */
const fs = require('fs'),
    path = require('path'),
    multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images/users')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.slice((file.originalname.lastIndexOf(".") - 1 >>> 0) + 2))
    }
});
const limits = {
    files: 1,
    fileSize: 1024 * 1024, // 1 MB (max file size)
}
const fileFilter = function (req, file, cb) {
    var allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];     // supported image file mimetypes

    if (allowedMimes.includes(file.mimetype)) {
        // allow supported image files
        cb(null, true);
    } else {
        // throw error for invalid files
        // cb(null, false);
        return cb(new multer.MulterError('INVALID_FILETYPE' ,'Invalid file type. Only jpeg, jpg and png image files are allowed.'));
    }
};
const upload = multer({ 
    storage: storage,
    limits: limits,
    fileFilter: fileFilter
 });

let profileImageUpload = upload.single('profileImage')
/* end multer config */

/* profile route */
router.get('/profile', allMiddlewares.rejectAdmin, function(req, res){
    try {
        const id = mongoose.Types.ObjectId(req.user._id);
        User.findById( id, '-username', function(err, userData){
        if(err){
            req.flash("errorMessage","Something went wrong, please try again.");
            res.render("/")
        } else {
            userData.skills = ["Web Development", "Frontend Development", "Penetration testing", "DevOps", "Machine Learning", "Blockchain"];
            res.render("Profile/profile", userData);
        }
    });
    } catch (error) {
        logger.error("Invalid Profile ID in request object.");
        req.flash("errorMessage","Can't find your profile, please try again.");
        res.redirect('/');
    }

});

router.post('/profile', allMiddlewares.isLoggedIn, function(req, res){
    const receivedData = req.body;
    
    if(receivedData && receivedData.profile && receivedData.profile.dob)
        receivedData.profile.dob = new Date(receivedData.profile.dob);

    User.findByIdAndUpdate(mongoose.Types.ObjectId(req.user._id), { profile: receivedData.profile }, function(err, data){
        if(err){
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect("/profile");
        } else {
            req.flash("successMessage", "Data updated successfully.");
            res.redirect("/profile");
        }
    });
});

router.post('/profile/accountData', allMiddlewares.isLoggedIn, function (req, res) {
    const receivedData = req.body;

    if (!receivedData.receiveMsg) receivedData.receiveMsg="false";

    if (receivedData.userType && ["student", "alumni"].includes(receivedData.userType) && 
        receivedData.firstName && receivedData.firstName.length > 0 && 
        receivedData.lastName && receivedData.lastName.length>0) {
        const newData = {
            firstName: receivedData.firstName,
            lastName: receivedData.lastName,
            userType: receivedData.userType,
            receiveMsg: receivedData.receiveMsg
        }
        User.findByIdAndUpdate(mongoose.Types.ObjectId(req.user._id), newData, function (err, data) {
            if (err) {
                logger.error(err);
                req.flash("errorMessage", "Something went wrong, please try again.")
                res.redirect("/profile");
            } else if (receivedData.firstName != req.user.firstName || receivedData.firstName + " " + receivedData.lastName != req.user.fullName) {
                // req.flash("successMessage", "Updated data & logged you out successfully.");
                User.updateMany({ "chats.userid": mongoose.Types.ObjectId("604dab175755e219fca82828") }, { $set: { "chats.$.username": receivedData.firstName + " " + receivedData.lastName } }, { "multi": true }, function (err, data) {
                    if(err) {
                        logger.error(err);
                    }
                });

                res.redirect("/logout");
            } else {
                req.flash("successMessage", "Data updated successfully.");
                res.redirect("/profile");
            }
        });
    } else {
        req.flash("errorMessage", "Something went wrong, please try again.");
        res.redirect('/profile');
    }
});

router.post('/profile/image', allMiddlewares.isLoggedIn, function(req, res){
    profileImageUpload(req, res, function(err){
        if (err){
            if (err instanceof multer.MulterError){

                if (err.code =="LIMIT_FILE_SIZE"){
                    req.flash("errorMessage","Please choose a image with size upto 1MB.");
                    res.redirect('/profile');
                } else if (err.code =="INVALID_FILETYPE"){
                    req.flash("errorMessage","Please choose a file of type JPG or JPEG or PNG");
                    res.redirect('/profile');
                } else {
                    logger.error(err);
                    req.flash("errorMessage","Something went wrong with file upload.");
                    res.redirect('/profile');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/profile');
            }
        } else if(req.file){
            const pathToFile = path.join(__dirname, '..' + '/uploads');
            let id = mongoose.Types.ObjectId(req.user._id);
            
            User.findById(id, "profileImage", function(err, data) {
                if(err) {
                    logger.error(err);
                    req.flash("errorMessage", "Something went wrong, while deleting old profile image. ");
                } else if (data.profileImage) {
                    fs.unlink(pathToFile + data.profileImage, function(err) {
                        if (err) {
                            logger.error(err);
                        }
                        return;
                    });
                }
            });

            const temp = path.join(__dirname, '..' + '/uploads/images/users/', req.file.filename);

            sharp(temp).resize(400, 400, {
                fit: "cover"
            })
            .toBuffer()
            .then((buffer) => {
                sharp(buffer).toFile(temp);
                const image = "/images/users/" + req.file.filename;
                User.findByIdAndUpdate(id, { profileImage: image }, function (err) {
                    if (err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect('/profile')
                    } else {
                        req.flash("successMessage", "Updated profile image successfully.");
                        res.redirect('/profile')
                    }
                });
                
            }).catch((err) => {
                logger.error(err)
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/profile');
            });

        } else {
            req.flash("errorMessage","Something went wrong, please try again.");
            res.redirect('/profile')
        }
    });
});

router.delete('/profile/image', allMiddlewares.isLoggedIn, function(req, res){
    const pathToFile = path.join(__dirname, '..' + '/uploads');
    const id = mongoose.Types.ObjectId(req.user._id);

    User.findById(id, "profileImage", function(err, data) {
        if(err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, while deleting old profile image. ");
        } else if (data.profileImage) {
            fs.unlink(pathToFile + data.profileImage, function(err) {
                if (err) {
                    logger.error(err);
                }
                return;
            });
        }
    });

    User.findByIdAndUpdate(id, { profileImage: "" }, function(err, userData){
        if(err){
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/profile')
        } else {
            req.flash("successMessage", "Removed profile image successfully.");
            res.redirect('/profile')
        }
    });
});

router.get('/profile/:id', function(req, res){
    try {
        const id = mongoose.Types.ObjectId(req.params.id);
        User.findById(id, function(err, userData){
            if(err){
                logger.error(err);
                req.flash("errorMessage", "Something went wrong, please try again later.");
                res.redirect('/communicate');
            } else if(userData){
                res.render('Profile/publicProfileView', userData );
            } else {
                req.flash("errorMessage", "User Data not found.");
                res.redirect('/communicate');
            }
        });
    } catch (error) {
        logger.error("Invalid Profile ID");
        req.flash("errorMessage", "Invalid profile ID, please try again.");
        res.redirect('/communicate');
    }
});

/* end profile routes */

/* communicate routes */

router.get('/communicate', allMiddlewares.isLoggedIn, function(req, res){
    User.find({ userType: "alumni", receiveMsg: true }, "firstName lastName profileImage profile.bio", function(err, users) {
        if (err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect("/");
        } else if (users.length > 0) {
            const lastId = users[users.length - 1]._id,
            firstId = users[0]._id;

            res.render('communicate', {
                alumni: users, 
                countAlumni: users.length,
                firstId: firstId,
                lastId: lastId, 
                page: 1
            });
        } else {
            req.flash("errorMessage", "No users found.")
            res.redirect("/");
        }
    }).sort({ _id: 1 }).limit(12).lean();
});

/* router.post("/communicate/page/:num", allMiddlewares.isLoggedIn, function (req, res) {
    const lastId = req.body.lastid;
    const lastPage = req.params.num;
    User.find({ _id: { $gt: mongoose.Types.ObjectId(lastId) } }, "firstName lastName profileImage profile.bio", function (err, users) {
        if (err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect("/communicate");
        } else if (users.length > 0) {
            const lastId = users[users.length - 1]._id;
            res.render('communicate', { alumni: users, countAlumni: users.length, lastId: lastId, lastPage: lastPage });
        } else {
            req.flash("errorMessage", "No more Users.")
            res.redirect("/communicate");
        }
    }).sort({ _id: 1 }).limit(12).lean();
}); */

router.get("/communicate/page", allMiddlewares.isLoggedIn, function(req, res) {
    const page = req.query.n, operation = req.query.q;

    let id0 = req.query.i0, id1 = req.query.i1;

    try {
        id0 = mongoose.Types.ObjectId(id0);
        id1 = mongoose.Types.ObjectId(id1);

        if (page > 0 && operation && id0 && id1) {
            if(operation == 0) {
                User.find({ 
                        _id: { 
                            $lt: mongoose.Types.ObjectId(id0)
                        },
                        userType: "alumni", 
                        receiveMsg: true
                    }, "firstName lastName profileImage profile.bio", function (err, users) {
                    if (err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect("/communicate");
                    } else if (users.length > 0) {
                        const firstId = users[users.length - 1]._id,
                            lastId = users[0]._id;

                        res.render('communicate', {
                            alumni: users.reverse(),
                            countAlumni: users.length,
                            firstId: firstId,
                            lastId: lastId,
                            page: page
                        });
                    } else {
                        req.flash("errorMessage", "No more Users.")
                        res.redirect("/communicate");
                    }
                }).sort({ _id: -1 }).limit(12).lean();
            } else {
                User.find({
                    _id: {
                        $gt: mongoose.Types.ObjectId(id1)
                    },
                    userType: "alumni",
                    receiveMsg: true
                }, "firstName lastName profileImage profile.bio", function (err, users) {
                    if (err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect("/communicate");
                    } else if (users.length > 0) {
                        const lastId = users[users.length - 1]._id,
                            firstId = users[0]._id;

                        res.render('communicate', {
                            alumni: users,
                            countAlumni: users.length,
                            firstId: firstId,
                            lastId: lastId,
                            page: page
                        });
                    } else {
                        req.flash("errorMessage", "No more Users.")
                        res.redirect("/communicate");
                    }
                }).sort({ _id: 1 }).limit(12).lean();
            }
        } else {
            req.flash("errorMessage", "Query parameters are missing.");
            res.redirect("/communicate");
        }
    } catch (error) {
        logger.error(error);
        req.flash("errorMessage", "Something went wrong, please try again.");
        res.redirect("/communicate");
    }
});

router.get("/communicate/search", allMiddlewares.isLoggedIn, function(req, res) {
    const query = req.query.q;

    if(query && query.length>0) {
        const _split = query.trim().split(" ");
        let formatInput;

        if(_split.length>1) {
            formatInput = { $or: [
                {
                    userType: "alumni", 
                    receiveMsg: true,
                    firstName: { $regex: _split[0], $options: "i" }
                },
                {
                    userType: "alumni", 
                    receiveMsg: true,
                    firstName: { $regex: _split[1], $options: "i" }
                },
                {
                    userType: "alumni", 
                    receiveMsg: true,
                    lastName: { $regex: _split[0], $options: "i" }
                },
                {
                    userType: "alumni", 
                    receiveMsg: true,
                    lastName: { $regex: _split[1], $options: "i" }
                }
            ] };

        } else {
            formatInput = { $or: [
                { 
                    userType: "alumni", 
                    receiveMsg: true,
                    firstName: { $regex: _split[0], $options: 'i' }
                },
                { 
                    userType: "alumni", 
                    receiveMsg: true,
                    lastName: { $regex: _split[0], $options: 'i' }
                }
            ] };
        }

        User.find( formatInput, "firstName lastName profileImage profile.bio", function(err, users) {
            if (err) {
                logger.error(err);
                res.send("Failed");
            } else if (users.length > 0) {
                res.json(users);
            } else {
                res.send("None");
            }
        }).lean();
    } else {
        res.send("Invalid");
    }
});

/* end communicate routes */


module.exports = router;