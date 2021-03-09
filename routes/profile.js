const express = require("express"),
router = express.Router(),
mongoose = require("mongoose");

const User = require("../models/user");

const middlewares = require('../middleware/index.js');

/* Multer config */
const fs = require('fs'),
    path = require('path'),
    multer = require('multer');
const e = require("express");
const { connect } = require("http2");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
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
router.get('/profile', middlewares.rejectAdmin, function(req, res){
    User.findById( req.user._id, '-username -__v', function(err, userData){
        if(err){
            req.flash("errorMessage","Something went wrong, please try again.");
            res.render("/")
        } else {
            res.render("Profile/profile", userData);
        }
    });
});

router.post('/profile', middlewares.isLoggedIn, function(req, res){
    const receivedData = req.body;
    if(!receivedData.username && !receivedData.firstName && !receivedData.salt)
    User.findByIdAndUpdate(req.user._id, receivedData, function(err, data){
        if(err){
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect("/profile");
        } else {
            req.flash("successMessage", "Data updated successfully.");
            res.redirect("/profile");
        }
    });
    // res.redirect('/profile');
});

router.post('/profile/accountData', middlewares.isLoggedIn, function (req, res) {
    const receivedData = req.body;
    if (!receivedData.receiveMsg) receivedData.receiveMsg="false";

    if (receivedData.userType && ["student", "alumni"].includes(receivedData.userType) && receivedData.firstName != "" && !receivedData.username && !receivedData.hash) {
        User.findByIdAndUpdate(req.user._id, receivedData, function (err, data) {
            if (err) {
                console.log(err);
                req.flash("errorMessage", "Something went wrong, please try again.")
                res.redirect("/profile");
            } else if (receivedData.firstName && receivedData.firstName != req.user.firstName) {
                req.flash("successMessage", "Updated data & logged you out successfully.");
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

router.post('/profile/image', middlewares.isLoggedIn, function(req, res){
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
                    console.log(err);
                    req.flash("errorMessage","Something went wrong with file upload.");
                    res.redirect('/profile');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/profile');
            }
        } else if(req.file){
            const image = {
                data: fs.readFileSync(path.join(__dirname, '..' + '/uploads/' + req.file.filename)),
                contentType: 'image/png'
            };
            if(image.data) {
                User.findByIdAndUpdate(req.user._id, { profileImage: image }, function (err, data) {
                    if (err) {
                        console.log(err);
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect('/profile')
                    } else {
                        req.flash("successMessage", "Updated profile image successfully.");
                        res.redirect('/profile')
                    }
                });
            } else {
                req.flash("errorMessage", "Please choose a image.");
                res.redirect('/profile')
            }
            const pathToFile = path.join(__dirname, '..' + '/uploads/' + req.file.filename);
            fs.unlink(pathToFile, function(err) {
                if (err) {
                    console.log(err);
                    return;
                }
            });
        } else {
            req.flash("errorMessage","Something went wrong, please try again.");
            res.redirect('/profile')
        }
    });
});

router.delete('/profile/image', middlewares.isLoggedIn, function(req, res){
    User.findByIdAndUpdate(req.user._id, { profileImage: {} }, function(err, userData){
        if(err){
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/profile')
        } else {
            req.flash("successMessage", "Removed profile image successfully.");
            res.redirect('/profile')
        }
    });
});

router.get('/profile/:id', function(req, res){
    User.findById(mongoose.Types.ObjectId(req.params.id), function(err, userData){
        if(err){
            console.log(err);
        } else if(userData){
            res.render('Profile/publicProfileView', userData );
        } else {
            res.redirect('/communicate');
        }
    })
});

/* end profile routes */

/* communicate routes */

router.get('/communicate', middlewares.isLoggedIn, function(req, res){
    User.aggregate([
        {
            $match: {
                "userType": {
                    "$exists": true,
                    "$ne": null
                },
                "receiveMsg": {
                    "$exists": true,
                    "$eq": true
                }
            } 
        },
        { 
            $group: {
                _id: "$userType",
                obj: {
                    $push: {
                        _id: "$_id",
                        firstName: "$firstName", 
                        lastName: "$lastName",
                        profileImage: "$profileImage",
                        bio: "$profile.bio"                    }
                    // $push: "$$ROOT"
                }
            } 
        }
    ]).exec(function (err, data) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect("/");
        } else if (data.length>0) {
            // console.log(JSON.stringify(data, null, 2));
            // let students = data[0]._id == "student" ? data[0].obj : data[1].obj;
            // let alumni = data[0]._id == "alumni" ? data[0].obj : data[1].obj;
            // res.render('communicate', { students: students, alumni: alumni});
            
            let alumni = data[0].obj;
            res.render('communicate', {alumni: alumni});
        } else {
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect("/");
        }
    });
});

/* end communicate routes */


module.exports = router;