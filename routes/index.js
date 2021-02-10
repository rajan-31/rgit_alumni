const express = require("express");
const router = express.Router();
const passport = require("passport");
const nodemailer = require("nodemailer");

const User  = require("../models/user"),
      News  = require("../models/news"),
      Event = require("../models/event");

const middlewares = require('../middleware/index.js');
const allMiddlewares = require("../middleware/index.js");
const Mail = require("nodemailer/lib/mailer");



router.get("/",function(req, res){
    News.find({}, { images: { $slice: 1 } }, function (err, allNews) {
        if (err) {
            console.log(err);
        } else {
            Event.find({}, { images: { $slice: 1 } }, function (err, allEvents) {
                if (err) {
                    console.log(err);
                } else if(req.isAuthenticated()) {
                    res.render("Home/home", { news: allNews, events: allEvents, dataFromFile: global.static_data });
                } else {
                    res.render("Home/guest", { news: allNews, events: allEvents, dataFromFile: global.static_data });
                }
            }).sort({ date: -1 }).limit(3).lean();
        }
    }).sort({ date: -1 }).limit(3).lean();
});

/* contribute route*/

router.get('/contribute', function(req, res){
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
    // req.logout();
    // req.flash("successMessage", "Logged you out successfully.");
    // res.redirect('/');

    req.session.destroy(function(err) {
        if(err) {
            req.flash("errorMessage", "Something went wrong please try again.");
            res.redirect('/'); // will always fire after session is destroyed
        } else {
            // req.flash("successMessage", "Logged you out successfully.");
            res.redirect('/'); // will always fire after session is destroyed
        }
      });
});

////////////////////////////////
// email routes
router.post('/mail',function(req, res, next) {
    if(req.body.message.length > 1000){
        res.send("Message is too big, no more than 1000 letters. You have " + req.body.message.length + " letters!");
    } else if (req.isAuthenticated()) {
        return next();
    } else res.send("Please Login First!");
} , async function(req, res) {
    let email = req.body.email;
    let subject = req.body.subject;
    let message = req.body.message;
    if(allMiddlewares.isValidEmail(email)) {
        let name = req.body.name,
        subject = req.body.subject,
        message = req.body.message;

        /* for gmail */
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
        /* for smtp server */
        // const transporter = nodemailer.createTransport({
        //     host: process.env.MAIL_HOST,
        //     port: process.env.MAIL_PORT,
        //     secure: process.env.MAIL_SECURE, // upgrade later with STARTTLS
        //     auth: {
        //         user: process.env.MAIL_USER,
        //         pass: process.env.MAIL_PASS
        //     }
        //   });

        // send email
        let sender = process.env.MAIL_USER;
        let senderName = process.env.MAIL_NAME;
        try {
            await transporter.sendMail({
                from: `${senderName} <${sender}>`, // sender address
                to: sender, // list of receivers
                subject: subject, // Subject line
                // text: message, // plain text body
                html: 
                `
                <!DOCTYPE html>
                <html>
                <head>
                    <style type="text/css">
                    .styled-table {
                        border-collapse: collapse;
                        margin: 25px 0;
                        font-size: 1.3em;
                        font-family: sans-serif;
                        min-width: 400px;
                        box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
                    }
                    .styled-table thead tr {
                        background-color: #009879;
                        color: #ffffff;
                        text-align: left;
                    }
                    .styled-table th,
                    .styled-table td {
                        padding: 12px 15px;
                    }
                    .styled-table tbody tr {
                        border-bottom: 1px solid #dddddd;
                    }
                    .styled-table tbody tr.active-row {
                        font-weight: bold;
                        color: #009879;
                    }
                    </style>
                </head>
                <body>
                    <table class="styled-table">
                    <tbody>
                        <tr>
                        <td>From</td>
                        <td>${name}</td>
                        </tr>
                        <tr class="active-row">
                        <td>Email ID</td>
                        <td><a href="mailto:${email}">${email}</a><br><small>(Click email address to reply.)</small></td>
                        </tr>
                        <tr>
                        <td>Subject</td>
                        <td>${subject}</td>
                        </tr>
                        <tr> 
                        <td>Message</td>
                        <td>${message}</td>
                        </tr>
                    </tbody>
                    
                </table>
                </body>
                </html>
                `, // html body
              });
              transporter.close();
              res.send("OK")
        } catch (err) {
            console.log(err);
            res.send("Something went wrong!!!");
        }
    } else {
        res.send("Invalid email entered!");
    }

});


module.exports = router;