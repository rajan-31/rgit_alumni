const express = require("express"),
router = express.Router(),
mongoose = require("mongoose");

const News = require("../models/news");

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
let uploadNewsImages = upload.array('images', 5);
/* end multer config */


router.get("/news", middlewares.isLoggedIn, function(req, res){
    News.find({}, { images: { $slice: 1 } }, function(err, allNews){
        if(err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect("/")
        } else {
            res.render("News/news", {news: allNews});
        }
    }).sort({ date: -1 }).lean();
});

router.post("/news", middlewares.isAdmin, function(req, res){
    // console.log(req.body);
    // console.log(req.files);
    // res.redirect('/admin/addNews')

    uploadNewsImages(req, res, function(err){
        if (err) {
            if (err instanceof multer.MulterError) {

                if (err.code == "LIMIT_FILE_SIZE") {
                    req.flash("errorMessage", "Please choose images with size upto 5MB.");
                    res.redirect('/admin/news');
                } else if (err.code == "INVALID_FILETYPE") {
                    req.flash("errorMessage", "Please choose files of type JPG or JPEG or PNG");
                    res.redirect('/admin/news');
                } else if (err.code == "LIMIT_FILE_COUNT"){
                    req.flash("errorMessage", "Please choose 5 or less images.");
                    res.redirect('/admin/news');
                } else {
                    console.log(err);
                    req.flash("errorMessage", "Something went wrong with file upload.");
                    res.redirect('/admin/news');
                }

            } else {
                req.flash("errorMessage", "Something went wrong, please try again.");
                res.redirect('/admin/news');
            }
        } else if(req.files){
            const title = req.body.title;
            const date = req.body.date;
            let images = [];
        
            const pathToFile = path.join(__dirname, '..' + '/uploads/');
            req.files.forEach(function(item){
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
            const newNews = {title: title, date: new Date(date), images: images, description: desc};
            News.create(newNews, function(err, newlyCreated){
                if(err){
                    console.log(err);
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/admin/news');
                } else{
                    req.flash("successMessage", "Added new news successfully.");
                    res.redirect('/admin/news');
                }
            });
            
        }
    });
});


router.get("/news/:id", middlewares.isLoggedIn, function(req, res){
    //to get item by id
    News.findById(mongoose.Types.ObjectId(req.params.id), function(err, foundNews){
        if(err){
            console.log(err);
            res.redirect('/news')
        } else if (foundNews) {
            res.render("News/showNews", {news: foundNews});
        } else {
            res.redirect('/news');
        }
    });

});

router.delete("/news/:id", middlewares.isAdmin, function(req, res){
    News.findByIdAndRemove(mongoose.Types.ObjectId(req.params.id), function (err) {
        if (err) {
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin/news');
        } else {
            req.flash("successMessage", "Deleted news successfully.");
            res.redirect('/admin/news');
        }
    });
});

router.put("/news/:id", middlewares.isAdmin, function (req, res) {
    uploadNewsImages(req, res, function (err) {
        if(err){
            if (err instanceof multer.MulterError) {

                if (err.code == "LIMIT_FILE_SIZE") {
                    req.flash("errorMessage", "Please choose images with size upto 5MB.");
                    res.redirect('/admin/news');
                } else if (err.code == "INVALID_FILETYPE") {
                    req.flash("errorMessage", "Please choose files of type JPG or JPEG or PNG");
                    res.redirect('/admin/news');
                } else {
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
            const desc = req.body.desc;
        
            let newsData;
            if (req.files && req.files.length > 0){
                let images = [];
                const pathToFile = path.join(__dirname, '..' + '/uploads/');
                req.files.forEach(function (item) {
                    const image = {
                        data: fs.readFileSync(pathToFile + item.filename),
                        contentType: item.mimetype
                    };
                    images.push(image)
                });
                newsData = { title: title, date: new Date(date), images: images, description: desc };
                req.files.forEach(function (item) {
                    fs.unlink(pathToFile + item.filename, function (err) {
                        if (err) {
                            console.log(err);
                        }
                        return;
                    });
                });
            } else{
                newsData = { title: title, date: new Date(date), description: desc };
            }
        
            News.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), newsData, function (err) {
                if (err) {
                    console.log(err);
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect("/admin/news");
                } else {
                    req.flash("successMessage", "News updated successfully.");
                    res.redirect("/admin/news");
                }
            });
        }
    });
});

router.get("/news/:id/edit", middlewares.isAdmin, function (req, res) {
    News.findById(mongoose.Types.ObjectId(req.params.id), function (err, foundNews) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.")
            res.redirect('/admin')
        } else {
            res.render("News/editNews", { news: foundNews });
        }
    });
});


module.exports = router;