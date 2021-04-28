const express = require("express"),
    router = express.Router(),
    mongoose = require("mongoose"),
    sharp = require("sharp"),
    sanitizeHtml = require('sanitize-html');
    sharp.cache(false);

const Event = require("../models/event");

const middlewares = require('../middleware/index.js');
const logger = require("../configs/winston_config");

/* Multer config */
const fs = require('fs'),
    path = require('path'),
    multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images/events')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.slice((file.originalname.lastIndexOf(".") - 1 >>> 0) + 2));
    }
});
const limits = {
    // files: 6,
    fileSize: 1024 * 1024 * 2, // 2 MB (max file size)
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
let uploadEventImages = upload.fields([{ name: "images", maxCount: 5}, { name: "thumbnail", maxCount: 1}]);
/* end multer config */


router.get("/events", middlewares.isLoggedIn, function (req, res) {
    Event.find({}, "-images", function (err, allEvents) {
            if (err) {
                logger.error(err);
                req.flash("errorMessage", "Something went wrong, please try again.")
                res.redirect("/")
            } else if(allEvents.length > 0){
                const lastId = allEvents[allEvents.length - 1]._id;
                const lastDate = new Date(allEvents[allEvents.length - 1].date).getTime();
                const firstId = allEvents[0]._id;
                const firstDate = new Date(allEvents[0].date).getTime();
                res.render("Events/events", { 
                    events: allEvents, 
                    countEvents: allEvents.length,
                    firstId: firstId,
                    firstDate: firstDate,
                    lastId: lastId, 
                    lastDate: lastDate, 
                    page: 1
                });
            } else {
                req.flash("errorMessage", "No events found!")
                res.redirect("/");
            }
        }).sort({ date: -1, _id: 1 }).limit(12).lean();
    });

router.get("/events/page", middlewares.isLoggedIn, function(req, res) {
    const page = req.query.n,
    operation = req.query.q;

    let date0, date1,
    id0 = req.query.i0,
    id1 = req.query.i1;
    
    try {
        date0 = new Date(Number(req.query.d0));
        date1 = new Date(Number(req.query.d1));

        id0 = mongoose.Types.ObjectId(id0);
        id1 = mongoose.Types.ObjectId(id1);

        if(page>0 && operation && date0 && id0 && date1 && id1) {
            if(operation == 0) {
                Event.find({
                    $or: [
                        { date: { $gt: date0 } },
                        {
                            date: date0,
                            _id: { $lt: id0 }
                        }
                    ]
                }, "-images", function (err, allEvents) {
                    if (err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please try again.")
                        res.redirect("/events")
                    } else if (allEvents.length > 0) {
                        const lastId = allEvents[0]._id;
                        const lastDate = new Date(allEvents[0].date).getTime();

                        const firstId = allEvents[allEvents.length - 1]._id;
                        const firstDate = new Date(allEvents[allEvents.length - 1].date).getTime();

                        res.render("Events/events", {
                            events: allEvents.reverse(),
                            countEvents: allEvents.length,
                            firstId: firstId,
                            firstDate: firstDate,
                            lastId: lastId,
                            lastDate: lastDate,
                            page: page
                        });
                    } else {
                        req.flash("errorMessage", "No more Events.")
                        res.redirect("/events");
                    }
                }).sort({ date: 1, _id: -1 }).limit(12).lean();
            } else {
                Event.find({
                    $or: [
                        { date: { $lt: date1 } },
                        {
                            date: date1,
                            _id: { $gt: id1 }
                        }
                    ]
                }, "-images", function (err, allEvents) {
                    if (err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please try again.")
                        res.redirect("/events")
                    } else if (allEvents.length > 0) {
                        const firstId = allEvents[0]._id;
                        const firstDate = new Date(allEvents[0].date).getTime();

                        const lastId = allEvents[allEvents.length - 1]._id;
                        const lastDate = new Date(allEvents[allEvents.length - 1].date).getTime();

                        res.render("Events/events", {
                            events: allEvents,
                            countEvents: allEvents.length,
                            firstId: firstId,
                            firstDate: firstDate,
                            lastId: lastId,
                            lastDate: lastDate,
                            page: page
                        });
                    } else {
                        req.flash("errorMessage", "No more Events.")
                        res.redirect("/events");
                    }
                }).sort({ date: -1, _id: 1 }).limit(12).lean();
            }
        } else {
            req.flash("errorMessage", "Query parameters are missing.");
            res.redirect("/events");
        }
    } catch (error) {
        logger.error(error)
        req.flash("errorMessage", "Something went wrong, please try again.");
        res.redirect("/events");
    }
});

router.post("/events", middlewares.isAdmin, function (req, res) {
    uploadEventImages(req, res, function (err) {
        if (err) {
            if (err instanceof multer.MulterError) {

                if (err.code == "LIMIT_FILE_SIZE") {
                    req.flash("errorMessage", "Please choose images with size upto 2MB.");
                    res.redirect('/admin/events');
                } else if (err.code == "INVALID_FILETYPE") {
                    req.flash("errorMessage", "Please choose files of type JPG or JPEG or PNG");
                    res.redirect('/admin/events');
                } else if (err.code == "LIMIT_FILE_COUNT") {
                    req.flash("errorMessage", "Please choose 5 or less images.");
                    res.redirect('/admin/events');
                } else {
                    logger.error(err);
                    req.flash("errorMessage", "Something went wrong with file upload.");
                    res.redirect('/admin/events');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/events');
            }
        } else if (req.files && req.files["images"] && req.files["thumbnail"]) {
            const title = req.body.title;
            const date = req.body.date;
            /* sanitize */
            const desc = sanitizeHtml(req.body.desc, {
                allowedTags: ["p","span","b","i","u","ol","ul","li","a","strike","font","br","hr","address","article","aside","footer","header","h1","h2","h3","h4","h5","h6","hgroup","main","nav","section","blockquote","dd","div","dl","dt","figcaption","figure","pre","abbr","bdi","bdo","cite","code","data","dfn","em","kbd","mark","q","rb","rp","rt","rtc","ruby","s","samp","small","strong","sub","sup","time","var","wbr","caption","col","colgroup","table","tbody","td","tfoot","th","thead","tr"],
                allowedAttributes: {
                    'a': ['href', 'target'],
                    '*': ['style', 'color'],
                },
            });
            
            let images = [];
            let thumbnail;

            for(let i=req.files["images"].length-1; i>=0; i--) {
                images.push( "/images/events/" + req.files["images"][i].filename);
            }
            
            const temp = path.join(__dirname, '..' + '/uploads/images/events/', req.files["thumbnail"][0].filename);

            sharp(temp).resize(300, 200, {
                fit: "cover"
            })
            .toBuffer()
            .then((buffer) => {
                sharp(buffer).toFile(temp);
                thumbnail = "/images/events/" + req.files["thumbnail"][0].filename;

                const newEvent = { title: title, date: new Date(date), images: images, description: desc, thumbnail: thumbnail };

                Event.create(newEvent, function (err) {
                    if (err) {
                        if (err.name === 'MongoError' && err.code === 11000) {
                            logger.error(err);
                            req.flash("errorMessage", "Duplicate title not allowed.");
                            res.redirect('/admin/events');
                        } else {
                            logger.error(err);
                            req.flash("errorMessage", "Something went wrong, please try again.");
                            res.redirect('/admin/events');
                        }
                    } else {
                        req.flash("successMessage", "Added new event successfully.");
                        res.redirect('/admin/events');
                    }
                });
            })
            .catch((err) => {
                logger.error(err)
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/events');
            });
        } else {
            req.flash("errorMessage", "Some fields are missing from form.");
            res.redirect('/admin/events');
        }
    });
});


router.get("/events/:id", middlewares.isLoggedIn, function (req, res) {
    try {
        const id = mongoose.Types.ObjectId(req.params.id);
        Event.findById(id, "-thumbnail", function (err, foundEvent) {
            if (err) {
                logger.error(err);
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/events');
            } else if (foundEvent) {
                res.render("Events/showEvent", { event: foundEvent, countImages: foundEvent.images.length });
            } else {
                req.flash("errorMessage", "Event not found.");
                res.redirect('/events');
            }
        });
    } catch (error) {
        logger.error("Invalid event ID.");
        req.flash("errorMessage", "Invalid event ID, please try again.");
        res.redirect('/events')
    }
});

router.delete("/events/:id", middlewares.isAdmin, function (req, res) {
    // delete old images
    Event.findById(mongoose.Types.ObjectId(req.params.id),"images thumbnail", function(err, data) {
        data.images.push(data.thumbnail);
        const pathToFile = path.join(__dirname, '..' + '/uploads');
        if(err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, while deleting old images.");
            res.redirect('/admin/events');
        } else {
            data.images.forEach(function (item) {
                fs.unlink(pathToFile + item, function (err) {
                    if (err) {
                        logger.error(err);
                    }
                    return;
                });
            });

            Event.findByIdAndRemove(mongoose.Types.ObjectId(req.params.id), function (err) {
                if (err) {
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/admin/events');
                } else {
                    req.flash("successMessage", "Deleted event successfully.");
                    res.redirect('/admin/events');
                }
            });
        }
    });
});

router.put("/events/:id", middlewares.isAdmin, function (req, res) {
    uploadEventImages(req, res, function (err) {
        if (err) {
            if (err instanceof multer.MulterError) {

                if (err.code == "LIMIT_FILE_SIZE") {
                    req.flash("errorMessage", "Please choose images with size upto 2MB.");
                    res.redirect('/admin/events');
                } else if (err.code == "INVALID_FILETYPE") {
                    req.flash("errorMessage", "Please choose files of type JPG or JPEG or PNG");
                    res.redirect('/admin/events');
                } else if (err.code == "LIMIT_FILE_COUNT") {
                    req.flash("errorMessage", "Please choose 5 or less images.");
                    res.redirect('/admin/events');
                } else {
                    logger.error(err);
                    req.flash("errorMessage", "Something went wrong with file upload.");
                    res.redirect('/admin/events');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/events');
            }
        } else {
            const title = req.body.title;
            const date = req.body.date;
            /* sanitize */
            const desc = sanitizeHtml(req.body.desc, {
                allowedTags: ["p","span","b","i","u","ol","ul","li","a","strike","font","br","hr","address","article","aside","footer","header","h1","h2","h3","h4","h5","h6","hgroup","main","nav","section","blockquote","dd","div","dl","dt","figcaption","figure","pre","abbr","bdi","bdo","cite","code","data","dfn","em","kbd","mark","q","rb","rp","rt","rtc","ruby","s","samp","small","strong","sub","sup","time","var","wbr","caption","col","colgroup","table","tbody","td","tfoot","th","thead","tr"],
                allowedAttributes: {
                    'a': ['href', 'target'],
                    '*': ['style', 'color'],
                },
            });

            if (req.files && Object.keys(req.files).length > 0) {
                let images = [];
                let thumbnail;

                const pathToFile = path.join(__dirname, '..' + '/uploads');

                if ( req.files["images"] && req.files["thumbnail"]) {
                    // both
                    // delete old images
                    Event.findById(mongoose.Types.ObjectId(req.params.id),"images thumbnail", function(err, data) {
                        data.images.push(data.thumbnail);
                        if(err) {
                            logger.error(err);
                            req.flash("errorMessage", "Something went wrong, while deleting old images. ");
                        } else {
                            data.images.forEach(function (item) {
                                fs.unlink(pathToFile + item, function (err) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    return;
                                });
                            });
                        }
                    });

                    for(let i=req.files["images"].length-1; i>=0; i--) {
                        images.push( "/images/events/" + req.files["images"][i].filename);
                    }

                    const temp = path.join(__dirname, '..' + '/uploads/images/events/', req.files["thumbnail"][0].filename);

                    sharp(temp).resize(300, 200, {
                        fit: "cover"
                    })
                    .toBuffer()
                    .then((buffer) => {
                        sharp(buffer).toFile(temp);
                        thumbnail = "/images/events/" + req.files["thumbnail"][0].filename;
        
                        const eventData = { title: title, date: new Date(date), images: images, description: desc, thumbnail: thumbnail };
        
                        Event.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), eventData, function (err) {
                            if (err) {
                                logger.error(err);
                                req.flash("errorMessage", "Something went wrong, please try again.");
                                res.redirect("/admin/events");
                            } else {
                                req.flash("successMessage", "Event updated successfully.");
                                res.redirect("/admin/events");
                            }
                        });
                        
                    })
                    .catch((err) => {
                        logger.error(err)
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect('/admin/events');
                    });

                } else if ( req.files["images"] && !req.files["thumbnail"] ) {
                    // only images
                    // delete old images
                    Event.findById(mongoose.Types.ObjectId(req.params.id),"images", function(err, data) {
                        if(err) {
                            logger.error(err);
                            req.flash("errorMessage", "Something went wrong, while deleting old images. ");
                        } else {
                            data.images.forEach(function (item) {
                                fs.unlink(pathToFile + item, function (err) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    return;
                                });
                            });
                        }
                    });

                    for(let i=req.files["images"].length-1; i>=0; i--) {
                        images.push( "/images/events/" + req.files["images"][i].filename);
                    }

                    const eventData = { title: title, date: new Date(date), images: images, description: desc };
        
                    Event.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), eventData, function (err) {
                        if (err) {
                            logger.error(err);
                            req.flash("errorMessage", "Something went wrong, please try again.");
                            res.redirect("/admin/events");
                        } else {
                            req.flash("successMessage", "Event updated successfully.");
                            res.redirect("/admin/events");
                        }
                    });

                } else {
                    // only thumbnail
                    // delete old thumbnail
                    Event.findById(mongoose.Types.ObjectId(req.params.id),"thumbnail", function(err, data) {
                        if(err) {
                            logger.error(err);
                            req.flash("errorMessage", "Something went wrong, while deleting old images. ");
                        } else {
                            fs.unlink(pathToFile + data.thumbnail, function (err) {
                                if (err) {
                                    logger.error(err);
                                }
                                return;
                            });
                        }
                    });

                    const temp = path.join(__dirname, '..' + '/uploads/images/events/', req.files["thumbnail"][0].filename);

                    sharp(temp).resize(300, 200, {
                        fit: "cover"
                    })
                    .toBuffer()
                    .then((buffer) => {
                        sharp(buffer).toFile(temp);
                        thumbnail = "/images/events/" + req.files["thumbnail"][0].filename;
        
                        const eventData = { title: title, date: new Date(date), description: desc, thumbnail: thumbnail };
        
                        Event.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), eventData, function (err) {
                            if (err) {
                                logger.error(err);
                                req.flash("errorMessage", "Something went wrong, please try again.");
                                res.redirect("/admin/events");
                            } else {
                                req.flash("successMessage", "Event updated successfully.");
                                res.redirect("/admin/events");
                            }
                        });
                        
                    })
                    .catch((err) => {
                        logger.error(err)
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect('/admin/events');
                    });
                }

            } else {
                // no images
                const eventData = { title: title, date: new Date(date), description: desc };

                Event.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), eventData, function (err) {
                    if (err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect("/admin");
                    } else {
                        req.flash("successMessage", "Event updated successfully.");
                        res.redirect("/admin/events");
                    }
                });
            }

            
        }
    });
});

router.get("/events/:id/edit", middlewares.isAdmin, function (req, res) {
    Event.findById(mongoose.Types.ObjectId(req.params.id), "-thumbnail", function (err, foundEvent) {
        if (err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect('/admin')
        } else {
            res.render("Events/editEvent", { event: foundEvent });
        }
    });
});


module.exports = router;