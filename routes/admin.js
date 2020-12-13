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

router.get("/admin", middlewares.isAdmin, function (req, res) {
    // let [month, date, year] = new Date().toLocaleDateString().split("/");
    // let todaysDate = year+"-"+month+"-"+date;
    const rawdata = fs.readFileSync(path.join(__dirname, '..' + '/public/data/data.json'));
    const dataFromFile = JSON.parse(rawdata);

    News.find({}, { images: { $slice: 1 }}, function (err, allNews) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/');
        } else {
            Event.find({}, { images: { $slice: 1 } }, function (err, allEvents) {
                if(err){
                    console.log(err);
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect('/');
                } else {

                    User.aggregate([
                        {
                            $match: {
                                "userType": {
                                    "$exists": true,
                                    "$ne": null
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$userType",
                                obj: {
                                    $push: {
                                        _id: "$_id",
                                        firstName: "$firstName",
                                        lastName: "$lastName",
                                        // profileImage: "$profileImage",
                                        // userType: "$userType",
                                        yearOfAdmission: "$profile.yearOfAdmission",
                                        yearOfGraduation: "$profile.yearOfGraduation",
                                        branch: "$profile.branch",
                                        dob: "$profile.dob"
                                    }
                                    // $push: "$$ROOT"
                                }
                            }
                        }
                    ]).exec(function (err, data) {
                        if (err) {
                            console.log(err);
                            req.flash("errorMessage", "Something went wrong, please try again.");
                            res.redirect('/');             
                        } else {
                            // console.log(JSON.stringify(data, null, 2));
                            let students = data[0]._id == "student"? data[0].obj: data[1].obj;
                            let alumni = data[0]._id == "alumni" ? data[0].obj : data[1].obj;
                            res.render("Admin/adminPanel", { news: allNews, events: allEvents, students: students, alumni: alumni, dataFromFile: dataFromFile });
                        }
                    });
                }

            }).sort({ date: -1 });
        }
    }).sort({ date: -1 });
});

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

router.get('/admin/logout', function (req, res) {
    req.logout();
    req.flash("successMessage", "Logged you out successfully.");
    res.redirect("/admin/login");
});



module.exports = router;