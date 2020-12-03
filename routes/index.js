const express = require("express");
const router = express.Router();
const passport = require("passport")

const User     = require("../models/user"),
      News = require("../models/news"),
      Event = require("../models/events");

/* router.get("/", function(req, res){    // may be change in future to set '/' as home
    res.redirect("/home");
}); */

router.get("/", function(req, res){
    // retrive showcases from mongoDB
    // Showcase.find({}, function(err, allShowcases){
    //   if(err){
    //         console.log(err);
    //     } else {
    //         res.render("home", {showcases: allShowcases});
    //     }
    // }).sort( { title : 1 } ); // sort in ascending order of title
    News.find({}, function (err, allNews) {
        if (err) {
            console.log(err);
        } else {
            res.render("home", { news: allNews });
        }
    }).sort({ date: -1 }).limit(3);
});

/* contribute route*/

router.get('/contribute', isLoggedIn, function(req, res){
    res.render("contribute");
});

/*********************
 * Authorization Routes
*/
router.get('/signup', function(req, res){
    res.render("signup")
});

router.post('/signup', function(req, res){
    const mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const allUserTypes = ["alumni", "student"]
    if (req.body.username.match(mailformat) && req.body.password==req.body.confirmPassword && allUserTypes.includes(req.body.userType)) {
        User.register(new User({firstName:req.body.firstName, lastName: req.body.lastName, username: req.body.username, userType :req.body.userType}), req.body.password, function(err, user){
            if(err){
                console.log(err);
                res.redirect("/signup");
            }
            // use loacl strategy
            passport.authenticate("user")(req, res, function(){
                res.redirect("/profile");
            });
        });
    } else {
        res.redirect("/signup")
    }
});

/* Local login */
router.get('/login', function(req, res){
    res.render("login");
});

router.post('/login', passport.authenticate("user",
    {
        successRedirect: "/",       // change this in future
        failureRedirect: "/login"
    }), function(req, res){
        
    });

/* Google login */
router.get('/oauth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/oauth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/profile');
    });

/////////////////////////////////
// logout
router.get('/logout', function(req, res){
    req.logout();
    res.redirect("/");
});

// middleware - to check whether user is logged in or not
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}


module.exports = router;