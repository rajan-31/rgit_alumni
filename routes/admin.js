const express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    mongoose = require("mongoose"),
    fs = require("fs"),
    path = require("path"),
    imagemin = require("imagemin"),
    imageminMozjpeg = require("imagemin-mozjpeg"),
    imageminPngquant = require("imagemin-pngquant");

const Admin = require("../models/admin"),
        News = require("../models/news"),
        Event = require("../models/event"),
        User = require("../models/user"),
        Testimonial = require("../models/Testimonial");

const middlewares = require('../middleware/index.js');
const { json } = require("body-parser");
const { render } = require("ejs");

/* Multer config */
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.').pop())
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

let testimonialImageUpload = upload.single('image')
/* end multer config */


router.get("/admin/login", function (req, res) {
    // req.logout()
    res.render("Admin/adminLogin");
});

router.post('/admin/login', passport.authenticate("admin",
    {
        successRedirect: "/admin",
        successFlash: { type: "successMessage", message: "Welcome back!" },
        failureRedirect: "/admin/login",
        failureFlash: { type: 'errorMessage', message: 'Invalid username or password.' }
    }), function (req, res) {});

router.post('/admin/signup', middlewares.isAdmin, function (req, res) {
    Admin.register(new Admin({ username: req.body.username, createdBy: req.user.username, active: true }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
        }
        // use loacal strategy
        // passport.authenticate('admin')(req, res, function () {
        //     res.redirect("/adminlist");      // change this in future
        // });
        else {
            req.flash("successMessage", "New admin created successfully.");
        }
        res.redirect("/admin/adminlist");
    });
});



router.post('/admin/externalData', middlewares.isAdmin, function(req, res){
    const data = JSON.stringify(req.body);

    // global.static_data = data;
    // res.redirect('/admin');
    
    // fs.writeFile(path.join(__dirname, '..' + '/data/data.json'), data, function(err){
    //     if(err){
    //         console.log(err);
    //         req.flash("errorMessage", "Something went wrong, please try again.");
    //     }
    //     res.redirect('/admin');
    // });

    fs.writeFileSync(path.join(__dirname, '..' + '/data/data.json'), data);
    res.redirect('/admin');
});

/* new routes */

// admin index
router.get("/admin", middlewares.isAdmin, function (req, res) {    
    User.countDocuments({ userType: "alumni" }, function(err, alumniCount){
        if(err){
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/');
        } else {
            User.countDocuments({ userType: "student" }, function (err, studentCount) {
                if (err) {
                    console.log(err);
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/');
                } else {
                    // global variable used: global.static_data
                    // res.render('Admin/index', { alumniCount: alumniCount, studentCount: studentCount, dataFromFile: global.static_data });
                    /////////////////
                    const raw_data = fs.readFileSync(path.join(__dirname, "..", "data/data.json"));
                    const dataFromFile = JSON.parse(raw_data);
                    res.render('Admin/index', { alumniCount: alumniCount, studentCount: studentCount, dataFromFile: dataFromFile });
                    ////////////////
                }
            });
        }
    });
});

/* news routes */
// admin all news
router.get('/admin/news', middlewares.isAdmin, function(req, res){
    News.find({}, 'title date', function (err, allNews) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/news', {allNews: allNews , countNews: allNews.length});
        }
    }) //.sort({ date: -1 });
});

//  admin add news
router.get('/admin/addNews', middlewares.isAdmin, function(req, res){
    res.render('Admin/addnews');
});

/* end news routes */

/* event routes */

// admin all event
router.get('/admin/events', middlewares.isAdmin, function(req, res){
    Event.find({}, 'title date', function (err, allEvents) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/events', {allEvents: allEvents , countEvents: allEvents.length});
        }
    })//.sort({ date: -1 });
});

//  admin add event
router.get('/admin/addEvent', middlewares.isAdmin, function(req, res){
    res.render('Admin/addevent');
});

/* end event routes */

// alumni list
router.get("/admin/alumnilist", middlewares.isAdmin, function (req, res) {
    User.find({ userType: "alumni" },'firstName lastName username', function (err, allAlumni) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/alumnilist', { countAlumni: allAlumni.length, allAlumni: allAlumni });
        }
    });
});

// student list
router.get("/admin/studentlist", middlewares.isAdmin, function (req, res) {
    User.find({ userType: "student" },'firstName lastName username', function (err, allStudents) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/studentlist', { countStudents: allStudents.length, allStudents: allStudents });
        }
    });
});

// admin list
router.get("/admin/adminlist", middlewares.isAdmin, function (req, res) {
    Admin.find({},'username createdBy', function (err, allAdmins) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/adminlist', { countAdmins: allAdmins.length, allAdmins: allAdmins });
        }
    });
});

router.delete("/admin/delete/:id", middlewares.isAdmin, function (req, res) {
    Admin.find({}, function (err, allAdmins) {
        if(err) {
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin/adminlist');
        } else if(allAdmins.length > 2) {
            Admin.findByIdAndRemove(mongoose.Types.ObjectId(req.params.id), function (err) {
                if (err) {
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/admin/adminlist');
                } else {
                    req.flash("successMessage", "Deleted Admin successfully.");
                    res.redirect('/admin/adminlist');
                }
            });
        } else {
            req.flash("errorMessage", "You can only delete Admins, if there are more than 2.");
            res.redirect('/admin/adminlist');
        }
    
    });
});

/* testimonials */
router.get("/admin/testimonials", middlewares.isAdmin, function(req, res) {
    Testimonial.find({}, function(err, allTestimonials) {
        if(err) {
            console.log(err);
            req.flash("errorMessage","Something went wrong, please try again.");
            res.redirect("/admin");
        } else {
            res.render("Admin/testimonials", { allTestimonials: allTestimonials, countTestimonials: allTestimonials.length });
        }
    });
});

router.get("/admin/addTestimonials", middlewares.isAdmin, function(req, res) {
    res.render("Admin/addTestimonials");
});

router.post("/admin/testimonials", middlewares.isAdmin, function(req, res) {
    testimonialImageUpload(req, res, function(err) {
        if (err){
            if (err instanceof multer.MulterError){

                if (err.code =="LIMIT_FILE_SIZE"){
                    req.flash("errorMessage","Please choose a image with size upto 1MB.");
                    res.redirect('/admin/testimonials');
                } else if (err.code =="INVALID_FILETYPE"){
                    req.flash("errorMessage","Please choose a file of type JPG or JPEG or PNG");
                    res.redirect('/admin/testimonials');
                } else {
                    console.log(err);
                    req.flash("errorMessage","Something went wrong with file upload.");
                    res.redirect('/admin/testimonials');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/testimonials');
            }
        } else if(req.file){
            const pathToFile = path.join(__dirname, '..' + '/uploads/' + req.file.filename);
            const temp = ['uploads/' + req.file.filename];
            (async () => {
                const file = await imagemin( temp, {
                    destination: 'uploads/',
                    plugins: [
                        imageminMozjpeg({quality: 40}),
                        imageminPngquant({quality: 40})
                    ]
                })

                const image = {
                    data: file[0].data,
                    contentType: req.file.mimetype
    
                };

                fs.unlink(pathToFile, function(err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
    
                const newTestinmonial = { name: req.body.name, branch: req.body.branch, content: req.body.content, image: image };
                Testimonial.create(newTestinmonial, function(err, data) {
                    if(err) {
                        console.log(err);
                        req.flash("errorMessage","Something went wrong, please try again.");
                        res.redirect("/admin/testimonials");
                    } else {
                        // Testimonial.find({}, function(err, allTestimonials) {
                        //     if(err) {
                        //         console.log(err);
                        //         req.flash("errorMessage","Something went wrong, please try again.");
                        //         res.redirect("/admin/testimonials");
                        //     } else{
                        //         global.allTestimonials = allTestimonials;
                        //         req.flash("successMessage", "Added new testimonial successfully.");
                        //         res.redirect('/admin/testimonials');
                        //     }
                        // });

                        req.flash("successMessage", "Added new testimonial successfully.");
                        res.redirect('/admin/testimonials');
                    }
                });
            })(temp, pathToFile);
        } else {
            req.flash("errorMessage","A image is needed.");
            res.redirect('/admin/testimonials')
        }
    });
});

router.get("/admin/testimonials/:id/edit", middlewares.isAdmin, function (req, res) {
    Testimonial.findById(mongoose.Types.ObjectId(req.params.id), function (err, data) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect('/admin/testimonials')
        } else {
            res.render("Admin/editTestimonials", { testimonial: data });
        }
    });
});

router.put("/admin/testimonials/:id", middlewares.isAdmin, function(req, res) {
    testimonialImageUpload(req, res, function(err) {
        if (err){
            if (err instanceof multer.MulterError){

                if (err.code =="LIMIT_FILE_SIZE"){
                    req.flash("errorMessage","Please choose a image with size upto 1MB.");
                    res.redirect('/admin/testimonials');
                } else if (err.code =="INVALID_FILETYPE"){
                    req.flash("errorMessage","Please choose a file of type JPG or JPEG or PNG");
                    res.redirect('/admin/testimonials');
                } else {
                    console.log(err);
                    req.flash("errorMessage","Something went wrong with file upload.");
                    res.redirect('/admin/testimonials');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/testimonials');
            }
        } else if (req.file){
            const pathToFile = path.join(__dirname, '..' + '/uploads/' + req.file.filename);

            const temp = ['uploads/' + req.file.filename];
            (async () => {
                const file = await imagemin( temp, {
                    destination: 'uploads/',
                    plugins: [
                        imageminMozjpeg({quality: 40}),
                        imageminPngquant({quality: 40})
                    ]
                })

                const image = {
                    data: file[0].data,
                    contentType: req.file.mimetype
    
                };

                fs.unlink(pathToFile, function(err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
    
                const newTestinmonial = { name: req.body.name, branch: req.body.branch, content: req.body.content, image: image };
                Testimonial.findByIdAndUpdate( mongoose.Types.ObjectId(req.params.id), newTestinmonial, function(err, data) {
                    if(err) {
                        console.log(err);
                        req.flash("errorMessage","Something went wrong, please try again.");
                        res.redirect("/admin/testimonials");
                    } else {
                        // Testimonial.find({}, function(err, allTestimonials) {
                        //     if(err) {
                        //         console.log(err);
                        //         req.flash("errorMessage","Something went wrong, please try again.");
                        //         res.redirect("/admin/testimonials");
                        //     } else{
                        //         global.allTestimonials = allTestimonials;
                        //         req.flash("successMessage", "Updated testimonial successfully.");
                        //         res.redirect('/admin/testimonials');
                        //     }
                        // });

                        req.flash("successMessage", "Updated testimonial successfully.");
                        res.redirect('/admin/testimonials');
                    }
                });
            })(temp, pathToFile);

        } else {
            const newTestinmonial = { name: req.body.name, branch: req.body.branch, content: req.body.content };

            Testimonial.findByIdAndUpdate( mongoose.Types.ObjectId(req.params.id), newTestinmonial, function(err, data) {
                if(err) {
                    console.log(err);
                    req.flash("errorMessage","Something went wrong, please try again.");
                    res.redirect("/admin/testimonials");
                } else {
                //     Testimonial.find({}, function(err, allTestimonials) {
                //         if(err) {
                //             console.log(err);
                //             req.flash("errorMessage","Something went wrong, please try again.");
                //             res.redirect("/admin/testimonials");
                //         } else{
                //             global.allTestimonials = allTestimonials;
                //             req.flash("successMessage", "Updated testimonial successfully.");
                //             res.redirect('/admin/testimonials');
                //         }
                //     });
                    req.flash("successMessage", "Updated testimonial successfully.");
                    res.redirect('/admin/testimonials');
                }
            });
        }
    });
   
});

router.delete("/admin/testimonials/:id", middlewares.isAdmin, function(req, res){
    Testimonial.findByIdAndRemove(mongoose.Types.ObjectId(req.params.id), function (err, data) {
        if (err) {
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin/testimonials');
        } else {
            // Testimonial.find({}, function(err, allTestimonials) {
            //         if(err) {
            //             console.log(err);
            //             req.flash("errorMessage", "Something went wrong, please try again.");
            //             res.redirect('/admin/testimonials');
            //         } else{
            //             global.allTestimonials = allTestimonials;
            //             req.flash("successMessage", "Deleted testimonial successfully.");
            //             res.redirect('/admin/testimonials');
            //         }
            // });

            req.flash("successMessage", "Deleted testimonial successfully.");
            res.redirect('/admin/testimonials');
        }
    });
});

/* end new routes */

// router.get('/admin/logout', function (req, res) {
//     req.session.destroy(function(err) {
//         if(err) {
//             req.flash("errorMessage", "Something went wrong please try again.");
//             res.redirect('/');
//         } else {
//             res.redirect('/');
//         }
//       });
// });


module.exports = router;