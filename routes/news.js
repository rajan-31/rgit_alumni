const express = require("express");
const router = express.Router();

const News = require("../models/news");

router.get("/news", isLoggedIn, function(req, res){
    News.find({}, function(err, allNews){
        if(err){
            console.log(err);
        } else {
            res.render("News/news", {news: allNews});
        }
    });
});

router.post("/news", function(req, res){
    const title = req.body.title;
    const image = req.body.image;
    const desc = req.body.desc;
    const newNews = {title: title, image: image, description: desc};
    News.create(newNews, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else{
            res.redirect("/news");
        }
    });
});

router.get("/news/new", function(req, res){
    res.render("News/newNews");
});

// this route is after "/news/new" because it will accept anything after "/news/" that means "new" also which will make "/news/new" useless
router.get("/news/:id", isLoggedIn, function(req, res){
    //to get item by id
    News.findById(req.params.id, function(err, foundNews){
        if(err){
            console.log(err);
        } else{
            res.render("News/showNews", {news: foundNews});
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


module.exports = router;