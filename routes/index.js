const express = require("express");
const router = express.Router();
const passport = require("passport")

const User  = require("../models/user"),
      News  = require("../models/news"),
      Event = require("../models/event");

const middlewares = require('../middleware/index.js');
const allMiddlewares = require("../middleware/index.js");

router.get("/", function(req, res){
    News.find({}, { images: { $slice: 1 } }, function (err, allNews) {
        if (err) {
            console.log(err);
        } else {
            Event.find({}, { images: { $slice: 1 } }, function (err, allEvents) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("home", { news: allNews, events: allEvents });
                }
            }).sort({ date: -1 }).limit(3);
        }
    }).sort({ date: -1 }).limit(3);
});

/* contribute route*/

router.get('/contribute', middlewares.isLoggedIn, function(req, res){
    res.render("contribute");
});

/*********************
 * Authorization Routes
*/
router.get('/signup', function(req, res){
    res.render("signup")
});

router.post('/signup', function(req, res){
    const allUserTypes = ["alumni", "student"];
    const receivedData = req.body;

    if (allMiddlewares.isValidEmail(receivedData.username) && receivedData.password.length>=6 && receivedData.password==receivedData.confirmPassword && allUserTypes.includes(receivedData.userType)) {
        User.register(new User({firstName:receivedData.firstName, lastName: receivedData.lastName, username: receivedData.username, userType :receivedData.userType}), receivedData.password, function(err, user){
            if(err){
                if (err.name == "UserExistsError") {
                    req.flash("errorMessage", "Username already taken, please try different username.");
                    res.redirect("/signup");
                } else{
                    req.flash("errorMessage", "Something went wrong in, please try again");
                }
            } else{
                // use loacl strategy
                passport.authenticate("user")(req, res, function(){
                    req.flash("successMessage","Account Created Successfully.")
                    res.redirect("/profile");
                });
            }
        });
    } else if (!allMiddlewares.isValidEmail(receivedData.username)){
        req.flash("errorMessage", "Invalid email address format!");
        res.redirect("/signup")
    } else if (receivedData.password.length < 6){
        req.flash("errorMessage", "Password must be 6 characters long!");
        res.redirect("/signup")
    } else if (receivedData.password != receivedData.confirmPassword){
        req.flash("errorMessage", "Password Mismatch");
        res.redirect("/signup");
    } else {
        req.flash("errorMessage", "Something went wrong,  please try again.");
        res.redirect("/signup");
    }
});

/* Local login */
router.get('/login', function(req, res){
    res.render("login");
});

router.post('/login', passport.authenticate("user",
    {
        failureRedirect: "/login",
        failureFlash: { type: 'errorMessage', message: 'Invalid username or password.' }
    }), function (req, res) {
        req.flash("successMessage", `Welcome back, ${req.user.firstName}!`);
        res.redirect('/')
});

/* Google login */
router.get('/oauth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/oauth/google/callback',
    passport.authenticate(
        'google', 
        { 
            failureRedirect: '/login',
            failureFlash: { type: 'errorMessage', message: 'Something went Wrong, please try again.' }
        }
    ),
    function (req, res) {
        // Successful authentication, redirect.
        if(req.user.userType){
            req.flash("successMessage",`Welcome back, ${req.user.firstName}!`)
            res.redirect('/');
        } else {
            req.flash("successMessage", "Logged in successfully, please fill your details.");
            res.redirect('/profile');
        }
    });

/////////////////////////////////
// logout
router.get('/logout', function(req, res){
    req.logout();
    req.flash("successMessage", "Logged you out successfully.");
    res.redirect("/login");
});


module.exports = router;