const express = require("express"),
router = express.Router(),
mongoose = require("mongoose");

const User = require("../models/user");

/* Multer config */
const fs = require('fs'),
    path = require('path'),
    multer = require('multer');
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
        return cb(new Error('Invalid file type. Only jpeg, jpg and png image files are allowed.'));
    }
};
const upload = multer({ 
    storage: storage,
    limits: limits,
    fileFilter: fileFilter
 });
/* end multer config */

/* profile route */
router.get('/profile', isLoggedIn, function(req, res){
    User.findById( req.user._id, {_id: 0, username: 0, __v: 0}, function(err, userData){
        if(err){
            console.log(err);
        } else {
            res.render("Profile/profile", userData);
        }
    });
});

router.post('/profile', isLoggedIn,upload.none(), function(req, res){
    const receivedData = req.body;
    /*
     1. userType received & valid & firstName received & not blank
     2. userType not recived
    */
    if ( (receivedData.userType && ["student", "alumni"].includes(receivedData.userType) && receivedData.firstName != "" ) || !receivedData.userType ) {
        User.findByIdAndUpdate(req.user._id, receivedData, function(err, data){
            if(err){
                console.log(err);
            } else if (receivedData.firstName && receivedData.firstName != req.user.firstName){
                res.redirect("/logout");
            } else {
                res.redirect("/profile");
            }
        });
    }else {
        res.redirect('/profile');
    }
});
router.post('/profile/image', isLoggedIn, upload.single('profileImage'), function(req, res){
    if(req.file){
        const image = {
            data: fs.readFileSync(path.join(__dirname, '..' + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
        };
        if(image.data) {
            User.findByIdAndUpdate(req.user._id, { profileImage: image }, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/profile");
                }
            });
        } else {
            res.redirect("/profile");
        }
        const pathToFile = path.join(__dirname, '..' + '/uploads/' + req.file.filename);
        fs.unlink(pathToFile, function(err) {
            if (err) {
                console.log(err);
                return;
            }
        });
    } else {
        res.redirect('/profile')
    }
});

router.delete('/profile/image', isLoggedIn, function(req, res){
    User.findByIdAndUpdate(req.user._id, { profileImage: {} }, function(err, userData){
        if(err){
            console.log(err);
        } else {
            res.redirect('/profile');
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
            res.redirect('..');
        }
    })
});

/* end profile routes */

/* communicate routes */

router.get('/communicate', isLoggedIn, function(req, res){
    User.aggregate([
        { $group: {
            _id: "$userType",
            obj: {
                $push: {
                    _id: "$_id",
                    firstName: "$firstName", 
                    lastName: "$lastName",
                    profileImage: "$profileImage",
                    bio: "$profile.bio",
                    dob: "$profile.dob"
                }
                // $push: "$$ROOT"
            }
        } 
    }
    ]).exec(function (err, data) {
        if (err) {
            console.log(err)
        } else {
            // console.log(data);
            // console.log(data[0].obj);
            // console.log(data[1].obj);
            res.render('communicate', { students: data[0].obj, alumni: data[1].obj});
        }
    });
});

/* end communicate routes */

// middleware - to check whether user is logged in or not
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}


module.exports = router;