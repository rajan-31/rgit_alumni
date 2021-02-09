const express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    mongoose = require("mongoose"),
    fs = require("fs"),
    path = require("path");

const Admin = require("../models/admin"),
        News = require("../models/news"),
        Event = require("../models/event"),
        User = require("../models/user");

const middlewares = require('../middleware/index.js');
const { json } = require("body-parser");
const { render } = require("ejs");
const e = require("express");

// let static_data;    // to store data from data/data.json file

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
    Admin.register(new Admin({ username: req.body.username, createdBy: req.user.username }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
        }
        // use loacl strategy
        // passport.authenticate('admin')(req, res, function () {
        //     res.redirect("/adminlist");      // change this in future
        // });
        else {
            req.flash("successMessage", "New admin created successfully.");
        }
        res.redirect("/admin/adminlist");
    });
});

router.post('/admin/externalData', middlewares.isAdmin, function(req, res){
    const data = JSON.stringify(req.body);
    fs.writeFile(path.join(__dirname, '..' + '/data/data.json'), data, function(err){
        if(err){
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            global.static_data = data;
            res.redirect('/');
        }
    });
});

/* new routes */

// admin index
router.get("/admin", middlewares.isAdmin, function (req, res) {    
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
                    // global variable used: global.static_data
                    res.render('Admin/index', { alumniCount: alumniCount, studentCount: studentCount, dataFromFile: global.static_data });
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
    }) //.sort({ date: -1 });
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
    })//.sort({ date: -1 });
});

//  admin add event
router.get('/admin/addEvent', middlewares.isAdmin, function(req, res){
    res.render('Admin/addevent');
});

/* end event routes */

// alumni list
router.get("/admin/alumnilist", middlewares.isAdmin, function (req, res) {
    User.find({ userType: "alumni" },'firstName lastName username', function (err, allAlumni) {
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
    User.find({ userType: "student" },'firstName lastName username', function (err, allStudents) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/studentlist', { countStudents: allStudents.length, allStudents: allStudents });
        }
    });
});

// admin list
router.get("/admin/adminlist", middlewares.isAdmin, function (req, res) {
    Admin.find({},'username createdBy', function (err, allAdmins) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin');
        } else {
            res.render('Admin/adminlist', { countAdmins: allAdmins.length, allAdmins: allAdmins });
        }
    });
});

router.delete("/admin/delete/:id", middlewares.isAdmin, function (req, res) {
    Admin.find({}, function (err, allAdmins) {
        if(err) {
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/admin/adminlist');
        } else if(allAdmins.length > 2) {
            Admin.findByIdAndRemove(mongoose.Types.ObjectId(req.params.id), function (err) {
                if (err) {
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/admin/adminlist');
                } else {
                    req.flash("successMessage", "Deleted Admin successfully.");
                    res.redirect('/admin/adminlist');
                }
            });
        } else {
            req.flash("errorMessage", "You can only delete Admins, if there are more than 2.");
            res.redirect('/admin/adminlist');
        }
    
    });
});

/* end new routes */

router.get('/admin/logout', function (req, res) {
    req.session.destroy(function(err) {
        if(err) {
            req.flash("errorMessage", "Something went wrong please try again.");
            res.redirect('/');
        } else {
            res.redirect('/');
        }
      });
});



module.exports = router;