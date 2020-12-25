const express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    fs = require("fs"),
    path = require("path");

const Admin = require("../models/admin"),
        News = require("../models/news"),
        Event = require("../models/event"),
        User = require("../models/user");

const middlewares = require('../middleware/index.js');
const { json } = require("body-parser");
const { render } = require("ejs");


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
    Admin.register(new Admin({ username: req.body.username }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
        }
        // use loacl strategy
        // passport.authenticate('admin')(req, res, function () {
        //     res.redirect("/admin");      // change this in future
        // });
        else {
            req.flash("successMessage", "New admin created successfully.");
        }
        res.redirect("/admin");
    });
});

router.post('/admin/externalData', middlewares.isAdmin, function(req, res){
    let data = JSON.stringify(req.body);
    fs.writeFile(path.join(__dirname, '..' + '/public/data/data.json'), data, function(err){
        if(err){
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
        }
        res.redirect('/');
    });
});

/* new routes */

// admin index
router.get("/admin", middlewares.isAdmin, function (req, res) {
    const rawdata = fs.readFileSync(path.join(__dirname, '..' + '/public/data/data.json'));
    const dataFromFile = JSON.parse(rawdata);

    User.countDocuments({ userType: "alumni" }, function(err, alumniCount){
        if(err){
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/');
        } else {
            User.countDocuments({ userType: "student" }, function (err, studentCount) {
                if (err) {
                    console.log(err);
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/');
                } else {
                    // res.render('Admin/index', { dataFromFile: dataFromFile });
                    res.render('Admin/index', { alumniCount: alumniCount, studentCount: studentCount, dataFromFile: dataFromFile });
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
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/news', {allNews: allNews , countNews: allNews.length});
        }
    }).sort({ date: -1 });
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
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/events', {allEvents: allEvents , countEvents: allEvents.length});
        }
    }).sort({ date: -1 });
});

//  admin add event
router.get('/admin/addEvent', middlewares.isAdmin, function(req, res){
    res.render('Admin/addevent');
});

/* end event routes */

// alumni list
router.get("/admin/alumnilist", middlewares.isAdmin, function (req, res) {
    User.find({}, function (err, allAlumni) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/alumnilist', { countAlumni: allAlumni.length, allAlumni: allAlumni });
        }
    });
});

// student list
router.get("/admin/studentlist", middlewares.isAdmin, function (req, res) {
    User.find({}, function (err, allStudents) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/studentlist', { countStudents: allStudents.length, allStudents: allStudents });
        }
    });
});


/* end new routes */

router.get('/admin/logout', function (req, res) {
    req.logout();
    req.flash("successMessage", "Logged you out successfully.");
    res.redirect("/admin/login");
});



module.exports = router;