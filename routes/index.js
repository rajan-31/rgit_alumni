const express = require("express");
const router = express.Router();
const passport = require("passport")

const User     = require("../models/user"),
      Showcase = require("../models/showcase");

/* router.get("/", function(req, res){    // may be change in future to set '/' as home
    res.redirect("/home");
}); */

router.get("/", function(req, res){
    // retrive showcases from mongoDB
    Showcase.find({}, function(err, allShowcases){
        if(err){
            console.log(err);
        } else {
            res.render("home", {showcases: allShowcases});
        }
    }).sort( { title : 1 } ); // sort in ascending order of title
});

// to insert new showcase in db
router.post("/showcase", function(req, res){
    const title = req.body.title;
    const image = req.body.image;
    const newShowcase = {title: title, image: image};
    // create & save to mongo
    Showcase.create(newShowcase, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else{
            res.redirect("/");
        }
    });
});

// form for new showcase
router.get("/showcase/new", function(req, res){
    res.render("newShowcase");
});

/*********************
 * Authorization Routes
*/
router.get('/signup', function(req, res){
    res.render("signup")
});

router.post('/signup', function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("signup");
        }
        // use loacl strategy
        passport.authenticate("local")(req, res, function(){
            res.redirect("/");      // change this in future
        });
    });
});

/* Local login */
router.get('/login', function(req, res){
    res.render("login");
});

router.post('/login', passport.authenticate("local", {
    successRedirect: "/",       // change this in future
    failureRedirect: "/login"
}), function(req, res){
    
});

/* Google login */
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

/////////////////////////////////
// logout
router.get('/logout', function(req, res){
    req.logout();
    res.redirect("/");
});


module.exports = router;