const express = require("express"),
    router = express.Router(),
    mongoose = require("mongoose");

const Event = require("../models/event");

const middlewares = require('../middleware/index.js');

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
    files: 5,
    fileSize: 1024 * 1024 * 5, // 5 MB (max file size)
}
const fileFilter = function (req, file, cb) {
    var allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];     // supported image file mimetypes

    if (allowedMimes.includes(file.mimetype)) {
        // allow supported image files
        cb(null, true);
    } else {
        // throw error for invalid files
        cb(null, false);
        cb(new multer.MulterError('INVALID_FILETYPE', 'Invalid file type. Only jpeg, jpg and png image files are allowed.'));
    }
};
const upload = multer({
    storage: storage,
    limits: limits,
    fileFilter: fileFilter
});
let uploadEventImages = upload.array('images', 5);
/* end multer config */


router.get("/events", middlewares.isLoggedIn, function (req, res) {
    Event.find({}, { images: { $slice: 1 } }, function (err, allEvents) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect("/")
        } else {
            res.render("Events/events", { events: allEvents });
        }
    }).sort({ date: -1 });
});

router.post("/events", middlewares.isAdmin, function (req, res) {
    uploadEventImages(req, res, function (err) {
        if (err) {
            if (err instanceof multer.MulterError) {

                if (err.code == "LIMIT_FILE_SIZE") {
                    req.flash("errorMessage", "Please choose images with size upto 5MB.");
                    res.redirect('/admin/events');
                } else if (err.code == "INVALID_FILETYPE") {
                    req.flash("errorMessage", "Please choose files of type JPG or JPEG or PNG");
                    res.redirect('/admin/events');
                } else if (err.code == "LIMIT_FILE_COUNT") {
                    req.flash("errorMessage", "Please choose 5 or less images.");
                    res.redirect('/admin/events');
                } else {
                    console.log(err);
                    req.flash("errorMessage", "Something went wrong with file upload.");
                    res.redirect('/admin/events');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/events');
            }
        } else if (req.files) {
            const title = req.body.title;
            const date = req.body.date;
            let images = [];

            const pathToFile = path.join(__dirname, '..' + '/uploads/');
            req.files.forEach(function (item) {
                const image = {
                    data: fs.readFileSync(pathToFile + item.filename),
                    contentType: item.mimetype
                };
                images.push(image);
            });
            /* delete files */
            req.files.forEach(function (item) {
                fs.unlink(pathToFile + item.filename, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    return;
                });
            });
            const desc = req.body.desc;
            const newEvent = { title: title, date: new Date(date), images: images, description: desc };
            Event.create(newEvent, function (err, newlyCreated) {
                if (err) {
                    console.log(err);
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/admin/events');
                } else {
                    req.flash("successMessage", "Added new event successfully.");
                    res.redirect('/admin/events');
                }
            });

        }
    });
});


router.get("/events/:id", middlewares.isLoggedIn, function (req, res) {
    //to get item by id
    Event.findById(mongoose.Types.ObjectId(req.params.id), function (err, foundEvent) {
        if (err) {
            console.log(err);
            res.redirect('/events')
        } else if (foundEvent) {
            res.render("Events/showEvent", { event: foundEvent });
        } else {
            res.redirect('/events');
        }
    });

});

router.delete("/events/:id", middlewares.isAdmin, function (req, res) {
    Event.findByIdAndRemove(mongoose.Types.ObjectId(req.params.id), function (err) {
        if (err) {
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin/events');
        } else {
            req.flash("successMessage", "Deleted event successfully.");
            res.redirect('/admin/events');
        }
    });
});

router.put("/events/:id", middlewares.isAdmin, function (req, res) {
    uploadEventImages(req, res, function (err) {
        if (err) {
            if (err instanceof multer.MulterError) {

                if (err.code == "LIMIT_FILE_SIZE") {
                    req.flash("errorMessage", "Please choose images with size upto 5MB.");
                    res.redirect('/admin/events');
                } else if (err.code == "INVALID_FILETYPE") {
                    req.flash("errorMessage", "Please choose files of type JPG or JPEG or PNG");
                    res.redirect('/admin/events');
                } else {
                    req.flash("errorMessage", "Something went wrong with file upload.");
                    res.redirect('/admin/events');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/events');
            }
            res.redirect('/admin/events');
        } else {
            const title = req.body.title;
            const date = req.body.date;
            const desc = req.body.desc;

            let eventData;
            if (req.files && req.files.length > 0) {
                let images = [];
                const pathToFile = path.join(__dirname, '..' + '/uploads/');
                req.files.forEach(function (item) {
                    const image = {
                        data: fs.readFileSync(pathToFile + item.filename),
                        contentType: item.mimetype
                    };
                    images.push(image)
                });
                eventData = { title: title, date: new Date(date), images: images, description: desc };
                req.files.forEach(function (item) {
                    fs.unlink(pathToFile + item.filename, function (err) {
                        if (err) {
                            console.log(err);
                        }
                        return;
                    });
                });
            } else {
                eventData = { title: title, date: new Date(date), description: desc };
            }

            Event.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), eventData, function (err) {
                if (err) {
                    console.log(err);
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect("/admin");
                } else {
                    req.flash("successMessage", "Event updated successfully.");
                    res.redirect("/admin");
                }
            });
        }
    });
});

router.get("/events/:id/edit", middlewares.isAdmin, function (req, res) {
    Event.findById(mongoose.Types.ObjectId(req.params.id), function (err, foundEvent) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect('/admin')
        } else {
            res.render("Events/editEvent", { event: foundEvent });
        }
    });
});


module.exports = router;