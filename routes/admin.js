const express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    mongoose = require("mongoose"),
    fs = require("fs"),
    path = require("path"),
    sharp = require("sharp");
    sharp.cache(false);

const Admin = require("../models/admin"),
    News = require("../models/news"),
    Event = require("../models/event"),
    User = require("../models/user"),
    Testimonial = require("../models/testimonial"),
    Newsletter = require("../models/newsletter"),
    Data = require("../models/data");

const middlewares = require('../middleware/index.js');
const logger = require("../configs/winston_config");

/* Multer config */
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images/testimonials')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.slice((file.originalname.lastIndexOf(".") - 1 >>> 0) + 2));
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

/////////////
// for recruiter image
const recruiterStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname +  '.' + file.originalname.slice((file.originalname.lastIndexOf(".") - 1 >>> 0) + 2));
    }
});

const recruiterUpload = multer({
    storage: recruiterStorage,
    limits: limits,
    fileFilter: fileFilter
});

let recruiterImageUpload = recruiterUpload.any();
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
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
        }
        else {
            req.flash("successMessage", "New admin created successfully.");
        }
        res.redirect("/admin/adminlist");
    });
});

router.post('/admin/externalData', middlewares.isAdmin, function(req, res){
    const temp = req.body;
    if(temp) {
        Data.findOneAndUpdate({ key: "home_page_data" }, { value: temp }, function(err) {
            if(err) {
                logger.error("Home page data update failed.");
                req.flash("errorMessage", "Something went wrong, please try again.");
            } else {
                const success = cacheData.set("home_page_data", temp);
                if(success) {
                    req.flash("successMessage", "Home data updated successfully.");
                } else {
                    logger.error("Home page data updated on Database, but caching failed (in admin operation).")
                    req.flash("errorMessage", "Something went wrong, please try again.");
                }
                res.redirect('/admin');
            }
        });
    } else {
        req.flash("errorMessage", "Data was missing, please try again.");
        res.redirect('/admin');
    }
});

/* new routes */

// admin index
router.get("/admin", middlewares.isAdmin, function (req, res) { 
    User.countDocuments({ userType: "alumni" }, function(err, alumniCount){
        if(err){
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/');
        } else {
            User.countDocuments({ userType: "student" }, function (err, studentCount) {
                if (err) {
                    logger.error(err);
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/');
                } else {
                    /* using cache */
                    let miscData = cacheData.get("home_page_data");
                    if(!miscData) {
                        Data.findOne({key: "home_page_data"}, function(err, _data) {
                            if(err) logger.error(err);
                            else if (_data) {
                                miscData = _data.value;

                                const success = cacheData.set("home_page_data", miscData);
                                if(success) {
                                    logger.info("Home page data retrived from Database and cached successfully (in fallback).");
                                } else {
                                    logger.error("Home page data retrived from Database and but caching failed (in fallback).");
                                }
                            } else {
                                logger.error("Home page data not available in cache as well as database.")
                                miscData = {
                                    youtubeURL:"https://www.youtube.com/watch?v=rF9cCAQXGgU",
                                    students:"300",
                                    studentsProgress:"40",
                                    alumni:"1000",
                                    alumniProgress:"70"
                                }
                            }
                        });
                    }
                    /*  */
                    res.render('Admin/index', { alumniCount: alumniCount, studentCount: studentCount, miscData: miscData });
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
            logger.error(err);
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
            logger.error(err);
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
            logger.error(err);
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
            logger.error(err);
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
            logger.error(err);
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

/* ------------
    Recruiters  
   ------------ */
router.post("/admin/recruiters", middlewares.isAdmin, function(req, res) {
    recruiterImageUpload(req, res, function(err) {
        if (err){
            if (err instanceof multer.MulterError){

                if (err.code =="LIMIT_FILE_SIZE"){
                    req.flash("errorMessage","Please choose a image with size upto 1MB.");
                    res.redirect('/admin');
                } else if (err.code =="INVALID_FILETYPE"){
                    req.flash("errorMessage","Please choose a file of type JPG or JPEG or PNG");
                    res.redirect('/admin');
                } else {
                    logger.error(err);
                    req.flash("errorMessage","Something went wrong with file upload.");
                    res.redirect('/admin');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin');
            }
        } else if(req.files.length>0){
            const temp = path.join(__dirname, ".." + "/uploads", req.files[0].filename)

            const image = sharp(temp);

            image
            .metadata()
            .then((metadata) => {
                if(metadata.width <= 80) {
                    return image.toBuffer();
                } else if (metadata.height > 80) {
                    return image
                    .resize({ width: 80, height: 80 })
                    .toBuffer();
                } else {
                    return image
                    .resize({ width: 80 })
                    .toBuffer();
                }
            })
            .then((buffer) => {
                sharp(buffer).toFile(path.join(__dirname, ".." + "/public/assets/img/clients", req.files[0].filename));

                fs.unlink(temp, function (err) {
                    if (err) {
                        logger.error(err);
                    }
                    return;
                });

                req.flash("successMessage", `Update image for ${req.files[0].fieldname}`);
                res.redirect("/admin")
            })
            .catch((err) => {
                logger.error(err)
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin');
            });
        } else {
            req.flash("errorMessage","Please choose a file.");
            res.redirect('/admin');
        }
    });
});

/* --------------
    testimonials 
   -------------- */
router.get("/admin/testimonials", middlewares.isAdmin, function(req, res) {
    Testimonial.find({}, "-image", function(err, allTestimonials) {
        if(err) {
            logger.error(err);
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
                    logger.error(err);
                    req.flash("errorMessage","Something went wrong with file upload.");
                    res.redirect('/admin/testimonials');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/testimonials');
            }
        } else if(req.file){
            const temp = path.join(__dirname, '..' + '/uploads/images/testimonials/', req.file.filename);

            sharp(temp).resize(200, 200, {
                fit: "cover"
            })
            .toBuffer()
            .then((buffer) => {
                sharp(buffer).toFile(temp);
                const image = '/images/testimonials/' + req.file.filename;

                const newTestinmonial = { name: req.body.name, branch: req.body.branch, content: req.body.content, image: image };
                Testimonial.create(newTestinmonial, function(err) {
                    if(err) {
                        logger.error(err.code);
                        req.flash("errorMessage","Something went wrong, please try again.");
                        res.redirect("/admin/testimonials");
                    } else {
                        req.flash("successMessage", "Added new testimonial successfully.");
                        res.redirect('/admin/testimonials');
                    }
                });
            })
            .catch((err) => {
                logger.error(err)
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/testimonials');
            });
        } else {
            req.flash("errorMessage","A image is needed.");
            res.redirect('/admin/testimonials')
        }
    });
});

router.get("/admin/testimonials/:id/edit", middlewares.isAdmin, function (req, res) {
    Testimonial.findById(mongoose.Types.ObjectId(req.params.id), function (err, data) {
        if (err) {
            logger.error(err);
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
                    logger.error(err);
                    req.flash("errorMessage","Something went wrong with file upload.");
                    res.redirect('/admin/testimonials');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/testimonials');
            }
        } else if (req.file){
            let id;
            try {
                id = mongoose.Types.ObjectId(req.params.id)
            } catch (error) {
                logger.error("Invalid Testimonial ID");
                req.flash("errorMessage","Something went wrong, please try again.");
                res.redirect('/admin/testimonials');
            }
            Testimonial.findById(id, "image", function(err, data) {
                if(err) {
                    logger.error(err);
                    req.flash("errorMessage", "Something went wrong, while deleting old image.");
                } else {
                    const pathToFile = path.join(__dirname, '..' + '/uploads');
                    fs.unlink(pathToFile + data.image, function (err) {
                        if (err) {
                            logger.error(err);
                        }
                        return;
                    });
                }
            });

            const temp = path.join(__dirname, '..' + '/uploads/images/testimonials/', req.file.filename);

            sharp(temp).resize(200, 200, {
                fit: "cover"
            })
            .toBuffer()
            .then((buffer) => {
                sharp(buffer).toFile(temp);
                const image = '/images/testimonials/' + req.file.filename;

                const testinmonialData = { name: req.body.name, branch: req.body.branch, content: req.body.content, image: image };
                Testimonial.findByIdAndUpdate(id, testinmonialData, function(err) {
                    if(err) {
                        logger.error(err);
                        req.flash("errorMessage","Something went wrong, please try again.");
                        res.redirect("/admin/testimonials");
                    } else {
                        req.flash("successMessage", "Testimonial updated successfully.");
                        res.redirect('/admin/testimonials');
                    }
                });
            })
            .catch((err) => {
                logger.error(err)
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/testimonials');
            });

        } else {
            const testinmonialData = { name: req.body.name, branch: req.body.branch, content: req.body.content };

            Testimonial.findByIdAndUpdate( mongoose.Types.ObjectId(req.params.id), testinmonialData, function(err) {
                if(err) {
                    logger.error(err);
                    req.flash("errorMessage","Something went wrong, please try again.");
                    res.redirect("/admin/testimonials");
                } else {
                    req.flash("successMessage", "Updated testimonial successfully.");
                    res.redirect('/admin/testimonials');
                }
            });
        }
    });
   
});

router.delete("/admin/testimonials/:id", middlewares.isAdmin, function(req, res){
    const id = mongoose.Types.ObjectId(req.params.id);
    Testimonial.findById(id, "image", function(err, data) {
        if(err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, while deleting old image.");
            res.redirect('/admin/testimonials');
        } else {
            const pathToFile = path.join(__dirname, '..' + '/uploads');
            fs.unlink(pathToFile + data.image, function (err) {
                if (err) {
                    logger.error(err);
                }
                return;
            });

            Testimonial.findByIdAndRemove(id, function (err) {
                if (err) {
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/admin/testimonials');
                } else {
                    req.flash("successMessage", "Deleted testimonial successfully.");
                    res.redirect('/admin/testimonials');
                }
            });
        }
    });
});

/* ------------
    Newsletter
   ------------ */
router.get("/newsletter", middlewares.isAdmin, function(req, res) {
    res.render("Admin/newsletterSubscribers");
});

router.get("/newsletter/all", middlewares.isAdmin, function(req, res) {
    Newsletter.find({}, function(err, allSubsribers) {
        if(err) {
            logger.error(err);
            res.send("Failed")
        } else if (allSubsribers.length == 0) {
            res.send("Null")
        } else {
            res.json(allSubsribers);
        }
    });
});

router.post("/newsletter", function(req, res) {
    const email = req.body.email;
    if(middlewares.isValidEmail(email)) {
        Newsletter.create({  email: email.toLowerCase() }, function (err) {
            if(err) {
                if(err.code == 11000) {
                    res.send("Exists")
                } else {
                    logger.error(err);
                    res.send("Failed");
                }
            } else {
                res.send("Done")
            }
        });
        
    } else {
        res.send("Invalid")
    }
});

router.delete("/newsletter/:id", function(req, res) {
    if (req.isAuthenticated() && req.user.role == "admin" ) {
        Newsletter.findByIdAndDelete(mongoose.Types.ObjectId(req.params.id), function(err) {
            if(err) {
                logger.error(err);
                res.send("Failed");
            } else {
                res.send("Done")
            }
        })
    } else {
        res.send("Not authenticated!")
    }
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