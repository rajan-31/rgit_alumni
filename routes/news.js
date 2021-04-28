const express = require("express"),
router = express.Router(),
mongoose = require("mongoose"),
sharp = require("sharp"),
sanitizeHtml = require('sanitize-html');
sharp.cache(false);

const News = require("../models/news");

const middlewares = require('../middleware/index.js');
const logger = require("../configs/winston_config");

/* Multer config */
const fs = require('fs'),
    path = require('path'),
    multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images/news')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.slice((file.originalname.lastIndexOf(".") - 1 >>> 0) + 2))
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
let uploadNewsImages = upload.fields([{ name: "images", maxCount: 5}, { name: "thumbnail", maxCount: 1}]);
/* end multer config */

router.get("/news", middlewares.isLoggedIn, function (req, res) {
    News.find({}, "-images", function (err, allNews) {
        if (err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect("/")
        } else if (allNews.length > 0) {
            const lastId = allNews[allNews.length - 1]._id;
            const lastDate = new Date(allNews[allNews.length - 1].date).getTime();
            const firstId = allNews[0]._id;
            const firstDate = new Date(allNews[0].date).getTime();
            res.render("News/news", {
                news: allNews,
                countNews: allNews.length,
                firstId: firstId,
                firstDate: firstDate,
                lastId: lastId,
                lastDate: lastDate,
                page: 1
            });
        } else {
            req.flash("errorMessage", "No news found!")
            res.redirect("/");
        }
    }).sort({ date: -1, _id: 1 }).limit(12).lean();
});

router.get("/news/page", middlewares.isLoggedIn, function (req, res) {
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

        if (page > 0 && operation && date0 && id0 && date1 && id1) {
            if (operation == 0) {
                News.find({
                    $or: [
                        { date: { $gt: date0 } },
                        {
                            date: date0,
                            _id: { $lt: id0 }
                        }
                    ]
                }, "-images", function (err, allNews) {
                    if (err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please try again.")
                        res.redirect("/news")
                    } else if (allNews.length > 0) {
                        const lastId = allNews[0]._id;
                        const lastDate = new Date(allNews[0].date).getTime();

                        const firstId = allNews[allNews.length - 1]._id;
                        const firstDate = new Date(allNews[allNews.length - 1].date).getTime();

                        res.render("News/news", {
                            news: allNews.reverse(),
                            countNews: allNews.length,
                            firstId: firstId,
                            firstDate: firstDate,
                            lastId: lastId,
                            lastDate: lastDate,
                            page: page
                        });
                    } else {
                        req.flash("errorMessage", "No more News.")
                        res.redirect("/news");
                    }
                }).sort({ date: 1, _id: -1 }).limit(12).lean();
            } else {
                News.find({
                    $or: [
                        { date: { $lt: date1 } },
                        {
                            date: date1,
                            _id: { $gt: id1 }
                        }
                    ]
                }, "-images", function (err, allNews) {
                    if (err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please try again.")
                        res.redirect("/news")
                    } else if (allNews.length > 0) {
                        const firstId = allNews[0]._id;
                        const firstDate = new Date(allNews[0].date).getTime();

                        const lastId = allNews[allNews.length - 1]._id;
                        const lastDate = new Date(allNews[allNews.length - 1].date).getTime();

                        res.render("News/news", {
                            news: allNews,
                            countNews: allNews.length,
                            firstId: firstId,
                            firstDate: firstDate,
                            lastId: lastId,
                            lastDate: lastDate,
                            page: page
                        });
                    } else {
                        req.flash("errorMessage", "No more News.")
                        res.redirect("/news");
                    }
                }).sort({ date: -1, _id: 1 }).limit(12).lean();
            }
        } else {
            req.flash("errorMessage", "Query parameters are missing.");
            res.redirect("/news");
        }
    } catch (error) {
        logger.error(error)
        req.flash("errorMessage", "Something went wrong, please try again.");
        res.redirect("/news");
    }
});

router.post("/news", middlewares.isAdmin, function(req, res){
    uploadNewsImages(req, res, function(err){
        if (err) {
            if (err instanceof multer.MulterError) {

                if (err.code == "LIMIT_FILE_SIZE") {
                    req.flash("errorMessage", "Please choose images with size upto 2MB.");
                    res.redirect('/admin/news');
                } else if (err.code == "INVALID_FILETYPE") {
                    req.flash("errorMessage", "Please choose files of type JPG or JPEG or PNG");
                    res.redirect('/admin/news');
                } else if (err.code == "LIMIT_FILE_COUNT"){
                    req.flash("errorMessage", "Please choose 5 or less images.");
                    res.redirect('/admin/news');
                } else {
                    logger.error(err);
                    req.flash("errorMessage", "Something went wrong with file upload.");
                    res.redirect('/admin/news');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/news');
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
                images.push( "/images/news/" + req.files["images"][i].filename);
            }
            
            const temp = path.join(__dirname, '..' + '/uploads/images/news/', req.files["thumbnail"][0].filename);

            sharp(temp).resize(300, 200, {
                fit: "cover"
            })
            .toBuffer()
            .then((buffer) => {
                sharp(buffer).toFile(temp);
                thumbnail = "/images/news/" + req.files["thumbnail"][0].filename;

                const newNews = { title: title, date: new Date(date), images: images, description: desc, thumbnail: thumbnail };

                News.create(newNews, function(err){
                    if(err){
                        if (err.name === 'MongoError' && err.code === 11000) {
                            logger.error(err);
                            req.flash("errorMessage", "Duplicate title not allowed.");
                            res.redirect('/admin/news');
                        } else {
                            logger.error(err);
                            req.flash("errorMessage", "Something went wrong, please try again.");
                            res.redirect('/admin/news');
                        }
                    } else {
                        req.flash("successMessage", "Added new news successfully.");
                        res.redirect('/admin/news');
                    }
                });
            })
            .catch((err) => {
                logger.error(err)
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/news');
            });
        } else {
            req.flash("errorMessage", "Some fields are missing from form.");
            res.redirect('/admin/news');
        }
    });
});


router.get("/news/:id", middlewares.isLoggedIn, function(req, res){
    try {
        const id = mongoose.Types.ObjectId(req.params.id);
        News.findById(id,"-thumbnail", function(err, foundNews){
            if(err){
                logger.error(err);
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/news')
            } else if (foundNews) {
                res.render("News/showNews", { news: foundNews, countImages: foundNews.images.length});
            } else {
                req.flash("errorMessage", "News not found.");
                res.redirect('/news');
            }
        });
    } catch (error) {
        logger.error("Invalid news ID.");
        req.flash("errorMessage", "Invalid news ID, please try again.");
        res.redirect('/news')
    }
});

router.delete("/news/:id", middlewares.isAdmin, function(req, res){
    // delete old images
    News.findById(mongoose.Types.ObjectId(req.params.id),"images thumbnail", function(err, data) {
        data.images.push(data.thumbnail);
        const pathToFile = path.join(__dirname, '..' + '/uploads');
        if(err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, while deleting old images.");
            res.redirect('/admin/news');
        } else {
            data.images.forEach(function (item) {
                fs.unlink(pathToFile + item, function (err) {
                    if (err) {
                        logger.error(err);
                    }
                    return;
                });
            });

            News.findByIdAndRemove(mongoose.Types.ObjectId(req.params.id), function (err) {
                if (err) {
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/admin/news');
                } else {
                    req.flash("successMessage", "Deleted news successfully.");
                    res.redirect('/admin/news');
                }
            });
        }
    });
});

router.put("/news/:id", middlewares.isAdmin, function (req, res) {
    uploadNewsImages(req, res, function (err) {
        if(err){
            if (err instanceof multer.MulterError) {

                if (err.code == "LIMIT_FILE_SIZE") {
                    req.flash("errorMessage", "Please choose images with size upto 2MB.");
                    res.redirect('/admin/news');
                } else if (err.code == "INVALID_FILETYPE") {
                    req.flash("errorMessage", "Please choose files of type JPG or JPEG or PNG");
                    res.redirect('/admin/news');
                } else if (err.code == "LIMIT_FILE_COUNT") {
                    req.flash("errorMessage", "Please choose 5 or less images.");
                    res.redirect('/admin/news');
                } else {
                    logger.error(err);
                    req.flash("errorMessage", "Something went wrong with file upload.");
                    res.redirect('/admin/news');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/news');
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
                    News.findById(mongoose.Types.ObjectId(req.params.id),"images thumbnail", function(err, data) {
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
                        images.push( "/images/news/" + req.files["images"][i].filename);
                    }

                    const temp = path.join(__dirname, '..' + '/uploads/images/news/', req.files["thumbnail"][0].filename);

                    sharp(temp).resize(300, 200, {
                        fit: "cover"
                    })
                    .toBuffer()
                    .then((buffer) => {
                        sharp(buffer).toFile(temp);
                        thumbnail = "/images/news/" + req.files["thumbnail"][0].filename;
        
                        const newsData = { title: title, date: new Date(date), images: images, description: desc, thumbnail: thumbnail };
        
                        News.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), newsData, function (err) {
                            if (err) {
                                logger.error(err);
                                req.flash("errorMessage", "Something went wrong, please try again.");
                                res.redirect("/admin/news");
                            } else {
                                req.flash("successMessage", "News updated successfully.");
                                res.redirect("/admin/news");
                            }
                        });
                        
                    })
                    .catch((err) => {
                        logger.error(err)
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect('/admin/news');
                    });

                } else if ( req.files["images"] && !req.files["thumbnail"] ) {
                    // only images
                    // delete old images
                    News.findById(mongoose.Types.ObjectId(req.params.id),"images", function(err, data) {
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
                        images.push( "/images/news/" + req.files["images"][i].filename);
                    }

                    const newsData = { title: title, date: new Date(date), images: images, description: desc };
        
                    News.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), newsData, function (err) {
                        if (err) {
                            logger.error(err);
                            req.flash("errorMessage", "Something went wrong, please try again.");
                            res.redirect("/admin/news");
                        } else {
                            req.flash("successMessage", "News updated successfully.");
                            res.redirect("/admin/news");
                        }
                    });

                } else {
                    // only thumbnail
                    // delete old thumbnail
                    News.findById(mongoose.Types.ObjectId(req.params.id),"thumbnail", function(err, data) {
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

                    const temp = path.join(__dirname, '..' + '/uploads/images/news/', req.files["thumbnail"][0].filename);

                    sharp(temp).resize(300, 200, {
                        fit: "cover"
                    })
                    .toBuffer()
                    .then((buffer) => {
                        sharp(buffer).toFile(temp);
                        thumbnail = "/images/news/" + req.files["thumbnail"][0].filename;
        
                        const newsData = { title: title, date: new Date(date), description: desc, thumbnail: thumbnail };
        
                        News.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), newsData, function (err) {
                            if (err) {
                                logger.error(err);
                                req.flash("errorMessage", "Something went wrong, please try again.");
                                res.redirect("/admin/news");
                            } else {
                                req.flash("successMessage", "News updated successfully.");
                                res.redirect("/admin/news");
                            }
                        });
                        
                    })
                    .catch((err) => {
                        logger.error(err)
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect('/admin/news');
                    });
                }

            } else {
                // no images
                const newsData = { title: title, date: new Date(date), description: desc };

                News.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), newsData, function (err) {
                    if (err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect("/admin");
                    } else {
                        req.flash("successMessage", "News updated successfully.");
                        res.redirect("/admin/news");
                    }
                });
            }
        
            
        }
    });
});

router.get("/news/:id/edit", middlewares.isAdmin, function (req, res) {
    News.findById(mongoose.Types.ObjectId(req.params.id), "-thumbnail", function (err, foundNews) {
        if (err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect('/admin')
        } else {
            res.render("News/editNews", { news: foundNews });
        }
    });
});


module.exports = router;