const express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    fs = require("fs"),
    path = require("path");

const Admin = require("../models/admin"),
        News = require("../models/news"),
        User = require("../models/user")



router.get("/admin", isAdmin, function (req, res) {
    // let [month, date, year] = new Date().toLocaleDateString().split("/");
    // let todaysDate = year+"-"+month+"-"+date;
    const rawdata = fs.readFileSync(path.join(__dirname, '..' + '/public/data/data.json'));
    const dataFromFile = JSON.parse(rawdata);

    News.find({}, function (err, allNews) {
        if (err) {
            console.log(err);
        } else {
            User.find({}, function(err, allUsers){
                if(err){
                    console.log(err);
                } else {
                    res.render("Admin/adminPanel", { news: allNews, allUsers: allUsers, dataFromFile: dataFromFile });
                }
            })
        }
    });
});

router.get("/admin/login", function (req, res) {
    // req.logout()
    res.render("Admin/adminLogin");
});

router.post('/admin/login', passport.authenticate("admin",
    {
        successRedirect: "/admin",       // change this in future
        failureRedirect: "/admin/login"
    }), function (req, res) {

    });

// router.get('/admin/signup', isAdmin, function (req, res) {
//     res.render("Admin/adminSignup")
// });

router.post('/admin/signup', isAdmin, function (req, res) {
    Admin.register(new Admin({ username: req.body.username }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/admin");
        }
        // use loacl strategy
        // passport.authenticate('admin')(req, res, function () {
        //     res.redirect("/admin");      // change this in future
        // });
        else {
            res.redirect("/admin");
        }
    });
});

router.post('/admin/externalData', isAdmin, function(req, res){
    let data = JSON.stringify(req.body);
    fs.writeFile(path.join(__dirname, '..' + '/public/data/data.json'), data, function(err){
        if(err){
            console.log(err);
        }
    });
    res.redirect('/admin');
});

router.get('/admin/logout', function (req, res) {
    res.redirect("/admin/login");
});

// middleware - to check whether admin is logged in or not
function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role=="admin") {
        return next();
    }
    res.redirect("/admin/login");
}

module.exports = router;