const express = require("express"),
router = express.Router(),
mongoose = require("mongoose");

const News = require("../models/news");

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
    fileSize: 1024 * 1024 * 5, // 1 MB (max file size)
}
const fileFilter = function (req, file, cb) {
    var allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];     // supported image file mimetypes

    if (allowedMimes.includes(file.mimetype)) {
        // allow supported image files
        cb(null, true);
    } else {
        // throw error for invalid files
        cb(null, false);
        cb(new Error('Invalid file type. Only jpeg, jpg and png image files are allowed.'));
    }
};
const upload = multer({
    storage: storage,
    limits: limits,
    fileFilter: fileFilter
});
/* end multer config */


router.get("/news", isLoggedIn, function(req, res){
    News.find({}, function(err, allNews){
        if(err){
            console.log(err);
        } else {
            res.render("News/news", {news: allNews});
        }
    }).sort({ date: -1 });
});

router.post("/news", isAdmin, upload.single('image'), function(req, res){
    const title = req.body.title;
    const date = req.body.date;
    const image = {
        data: fs.readFileSync(path.join(__dirname , '..'+ '/uploads/' + req.file.filename)),
        contentType: 'image/png'
    };
    const desc = req.body.desc;
    const newNews = {title: title, date: new Date(date), image: image, description: desc};
    News.create(newNews, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else{
            res.redirect("/admin");
        }
    });
    const pathToFile = path.join(__dirname, '..' + '/uploads/' + req.file.filename);
    fs.unlink(pathToFile, function (err) {
        if (err) {
            console.log(err);
            return;
        }
    });
});

// router.get("/news/new", function(req, res){
//     res.render("News/newNews");
// });

// this route is after "/news/new" because it will accept anything after "/news/" that means "new" also which will make "/news/new" useless
router.get("/news/:id", isLoggedIn, function(req, res){
    //to get item by id
    News.findById(mongoose.Types.ObjectId(req.params.id), function(err, foundNews){
        if(err){
            console.log(err);
        } else{
            res.render("News/showNews", {news: foundNews});
        }
    });

});

router.delete("/news/:id", isAdmin, function(req, res){
    News.findByIdAndRemove(mongoose.Types.ObjectId(req.params.id), function (err) {
        if (err) {
            res.redirect("/admin")
        } else {
            res.redirect("/admin");
        }
    });
});

router.put("/news/:id", isAdmin, upload.single('image'), function (req, res) {
    // console.log(req.params.id)
    // console.log(req.body.title)
    // console.log(req.file)
    const title = req.body.title;
    const date = req.body.date;
    const desc = req.body.desc;

    let newsData;
    if(req.file){
        const image = {
            data: fs.readFileSync(path.join(__dirname, '..' + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
        };
        newsData = { title: title, date: new Date(date), image: image, description: desc };
    } else{
        newsData = { title: title, date: new Date(date), description: desc };
    }

    News.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), newsData, function (err) {
        if (err) {
            res.redirect("/admin");
        } else {
            res.redirect("/admin");
        }
    });
});

router.get("/news/:id/edit", isAdmin, function (req, res) {
    News.findById(mongoose.Types.ObjectId(req.params.id), function (err, foundNews) {
        if (err) {
            console.log(err);
        } else {
            res.render("News/editNews", { news: foundNews });
        }
    });
});


// middleware - to check whether user is logged in or not
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}
// middleware - to check whether admin is logged in or not
function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role == "admin") {
        return next();
    }
    res.redirect("/admin/login");
}


module.exports = router;