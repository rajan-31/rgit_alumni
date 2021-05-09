const express = require("express");
const router = express.Router();
const passport = require("passport");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const User  = require("../models/user"),
      News  = require("../models/news"),
      Event = require("../models/event"),
      Testimonial = require("../models/testimonial");

const allMiddlewares = require("../middleware/index.js");
const allTemplates = require("../configs/mail_templates");
const logger = require("../configs/winston_config");

router.get("/",function(req, res){
    News.find({}, "-images", function (err, allNews) {
        if (err) {
            logger.error(err);
        } else {
            Event.find({}, "-images", function (err, allEvents) {
                /* using cache */
                let miscData = cacheData.get("home_page_data");
                if(!miscData) {
                    Data.findOne({key: "home_page_data"}, function(err, _data) {
                        if(err) logger.error(err);
                        else if (_data) {
                            miscData = _data.value;

                            const success = cacheData.set("home_page_data", miscData);
                            if(success) {
                                logger.info("Home page data retrived from Database and cached successfully (in fallback).");
                            } else {
                                logger.error("Home page data retrived from Database and but caching failed (in fallback).")
                            }
                        } else {
                            logger.error("Home page data not available in cache as well as database.")
                            miscData = {
                                youtubeURL:"https://www.youtube.com/watch?v=rF9cCAQXGgU",
                                students:"300",
                                studentsProgress:"40",
                                alumni:"1000",
                                alumniProgress:"70"
                            }
                        }
                    });
                }
                /*  */
                if (err) {
                    logger.error(err);
                } else if(req.isAuthenticated()) {
                    Testimonial.find({}, function(err, allTestimonials) {
                        res.render("Home/home", { news: allNews, countNews: allNews.length, events: allEvents, countEvents: allEvents.length, miscData: miscData, allTestimonials: allTestimonials, countTestimonials: allTestimonials.length });
                    });
                } else {
                    Testimonial.find({}, function(err, allTestimonials) {
                        res.render("Home/guest", { news: allNews, countNews: allNews.length, events: allEvents, countEvents: allEvents.length, miscData: miscData, allTestimonials: allTestimonials, countTestimonials: allTestimonials.length });
                    });
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
    const receivedData = req.body;

    const validEmail = receivedData.username && allMiddlewares.isValidEmail(receivedData.username);
    const correctPasswordLength = receivedData.password && receivedData.password.length>=6 && receivedData.password.length<=20;
    const matchedPasswords = receivedData.password==receivedData.confirmPassword;
    const validUserType = ["alumni", "student"].includes(receivedData.userType);
    const validFirstName = receivedData.firstName && receivedData.firstName.length>0;
    const validLastName = receivedData.lastName && receivedData.lastName.length>0;

    if ( validEmail && correctPasswordLength && matchedPasswords && validUserType && validFirstName && validLastName ) {
        User.register(new User({ firstName:receivedData.firstName, lastName: receivedData.lastName, username: receivedData.username.toLowerCase(), userType :receivedData.userType}), receivedData.password, function(err, user){
            if(err){
                if (err.name == "UserExistsError") {
                    req.flash("errorMessage", "Email already taken, please try different Email.");
                    res.redirect("/signup");
                } else{
                    logger.error(err);
                    req.flash("errorMessage", err);
                    res.redirect("/signup");
                }
            } else{
                crypto.randomBytes(5, async function (err, buf) {
                    const activation_code = user._id + buf.toString('hex');
                    user.activation_code = activation_code;
                    user.activation_expires = Date.now() + 172800000;    // 48Hrs
                    const activation_link = 'http://localhost:8080/account/activate/' + activation_code;

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

                    let sender = process.env.MAIL_USER;
                    let senderName = process.env.MAIL_NAME;
                    try {
                        await transporter.sendMail({
                            from: `${senderName} <${sender}>`, // sender address
                            to: `${user.firstName} ${user.lastName} <${user.username}>`, // list of receivers
                            replyTo: `Do not reply to this mail. <noreply@apsitskills.com>`,
                            subject: "Email Verification - APSIT Alumni Portal", // Subject line
                            // text: '',
                            html: allTemplates.activation_mail(activation_link)
                            
                        });
                        transporter.close();
                        user.save(function(err, user){
                            if(err) {
                                logger.error(err);
                                req.flash("errorMessage", "Something went wrong, please try again");
                                res.redirect("/signup");
                            } else {
                                // use loacl strategy
                                // passport.authenticate("user")(req, res, function(){
                                    // req.flash("successMessage","Account Created Successfully.")
                                    // res.redirect("/profile");
                                    // });
                                    
                                    // res.send('The activation email has been sent to ' + user.username + ', please click the activation link within 48 hours.');
                                    req.flash("successMessage", `Account Created Successfully. To activate your account, the activation email has been sent to ${user.username}, it will expire in 48 hours.`);
                                    res.redirect('/login');

                                }
                            });
                    } catch (err) {
                        logger.error(err);
                        req.flash("errorMessage", 'Something went wrong, please try again. If you get "Email already taken", then check your mail for activation link or generate a new one on login page.');
                        res.redirect("/signup");
                    }
                            
                });
            }
        });
    } else if (!validEmail){
        req.flash("errorMessage", "Invalid email address format!");
        res.redirect("/signup")
    } else if (!correctPasswordLength){
        req.flash("errorMessage", "Password length must be atleast 6 and atmost 20 characters!");
        res.redirect("/signup")
    } else if (!matchedPasswords){
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

// router.post('/login', passport.authenticate("user",
//     {
//         failureRedirect: "/login",
//         failureFlash: { type: 'errorMessage', message: 'Invalid username or password.' }
//     }), function (req, res) {
//         req.flash("successMessage", `Welcome back, ${req.user.firstName}!`);
//         res.redirect('/profile')
// });

router.post('/login', function(req, res, next) {
    passport.authenticate('user', function(err, user, info) {
        if (err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect("/login");
        } else if (!user) {
            if (info && info.name == "TooManyAttemptsError") {
                req.flash("errorMessage", "Account locked due to too many failed login attempts, contact admin.");
            } else {
                req.flash("errorMessage", "Invalid username or password.");
            }
            res.redirect('/login');
        } else {
            req.logIn(user, function(err) {
                if (err) { 
                    logger.error(err);
                    req.flash("errorMessage", "Something went wrong, please try again.");
                    res.redirect("/login");
                } else {
                    req.flash("successMessage", `Welcome back, ${req.user.firstName}!`);
                    res.redirect('/profile');
                }
            });
        }
    })(req, res, next);
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
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect('/'); // will always fire after session is destroyed
        } else {
            // req.flash("successMessage", "Logged you out successfully.");
            res.redirect('/'); // will always fire after session is destroyed
        }
      });
});

//////////////////////////////////
// account activation
router.get("/account/activate/resend", function(req, res) {
    res.render("activation");
});

router.get('/account/activate/:code', function(req, res) {
    const activation_code =  req.params.code
    User.findOne({ activation_code: activation_code} ,'active activation_expires', function(err, data) {
        if(err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect("/login");
        } else if (data) {
            if(data.active == false && data.activation_expires > Date.now()) {
                User.findByIdAndUpdate(data._id, { active: true}, function(err) {
                    if(err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please try again.");
                        res.redirect("/login");
                    } else {
                        req.flash("successMessage", "Account activated successfully, login to continue.");
                        res.redirect("/login");
                    }
                });
            } else if (data.active == true) {
                req.flash("successMessage", "Account already activated, login to continue.");
                res.redirect("/login");
            } else {
                req.flash("errorMessage", "Account activation link is expired, please generate new one.");
                res.redirect("/login");
            }
        } else {
            req.flash("errorMessage", "Invalid Account Activation Code.");
            res.redirect("/login");
        }
    }).lean();
});

router.post('/account/activate/resend', function(req, res) {
    const resend_to = req.body.username.toLowerCase();
    User.findOne({ username: resend_to}, 'active activation_code activation_expires firstName lastName', async function(err, data) {
        if (err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect("/login");
        } else if(!data) {
            req.flash("errorMessage", "Invalid Email!");
            res.redirect("/login");
        } else if (data.active == true) {
            req.flash("successMessage", "Account already activated, login to continue.");
            res.redirect("/login");
        } else if (data.activation_expires && Math.abs(Date.now() - data.activation_expires + 172800000) < 600000  ) {
            req.flash("errorMessage", "You need to wait for 10 minutes, before requesting the account activation link again.");
            res.redirect("/login");
        } else {
            data.activation_expires = Date.now() + 172800000; // 48 hrs
            
            // activation code exists
            if (data.activation_code) {
                const activation_link = 'http://localhost:8080/account/activate/' + data.activation_code;

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

                const sender = process.env.MAIL_USER;
                const senderName = process.env.MAIL_NAME;
                const receiverName = data.firstName + " " + data.lastName;
                try {
                    await transporter.sendMail({
                        from: `${senderName} <${sender}>`, // sender address
                        to: `${receiverName} <${resend_to}>`, // list of receivers
                        replyTo: `Do not reply to this mail. <noreply@apsitskills.com>`,
                        subject: "Email Verification - APSIT Alumni Portal", // Subject line
                        // text: '',
                        html: allTemplates.activation_mail(activation_link, receiverName)

                    });
                    transporter.close();
                    data.save(function (err, data) {
                        if (err) {
                            logger.error(err);
                            req.flash("errorMessage", "Something went wrong, please try again");
                            res.redirect("/login");
                        } else {
                            req.flash("successMessage", `The activation email has been sent to ${resend_to}, please click the activation link within 48 hours.`);
                            res.redirect('/login');
                        }
                    });

                } catch (err) {
                    logger.error(err);
                    req.flash("errorMessage", "Something went wrong, please check your mails and try again!");
                    res.redirect("/login");
                }
            } else {
                crypto.randomBytes(5, async function (err, buf) {
                    const activation_code = user._id + buf.toString('hex');
                    data.activation_code = activation_code;

                    const activation_link = 'http://localhost:8080/account/activate/' + activation_code;

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

                    const sender = process.env.MAIL_USER;
                    const senderName = process.env.MAIL_NAME;
                    const receiverName = data.firstName + " " + data.lastName;
                    try {
                        await transporter.sendMail({
                            from: `${senderName} <${sender}>`, // sender address
                            to: `${receiverName} <${resend_to}>`, // list of receivers
                            replyTo: `Do not reply to this mail. <noreply@apsitskills.com>`,
                            subject: "Email Verification - APSIT Alumni Portal", // Subject line
                            // text: '',
                            html: allTemplates.activation_mail(activation_link, receiverName)

                        });
                        transporter.close();
                        data.save(function (err, data) {
                            if (err) {
                                logger.error(err);
                                req.flash("errorMessage", "Something went wrong, please try again");
                                res.redirect("/login");
                            } else {
                                req.flash("successMessage", `The activation email has been sent to ${resend_to}, please click the activation link within 48 hours.`);
                                res.redirect('/login');
                            }
                        });

                    } catch (err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please check your mails and try again!");
                        res.redirect("/login");
                    }
                });
            }
        }
    });
});
////////////////////////////////

///////////////////////////////
// reset password
router.get("/account/password/reset", function(req, res) {
    res.render("password_reset_link");
});

router.post("/account/password/reset", function(req, res) {
    const _username = req.body.username.toLowerCase();
    User.findOne({ username: _username}, "username firstName lastName googleId password_reset_expires password_reset_last", function(err, user) {
        if(err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please check your mails and try again!");
            res.redirect("/login");
        } else if (!user) {
            req.flash("errorMessage", "Invalid Email!");
            res.redirect("/login");
        } else if(user.googleId) {
            req.flash("errorMessage", "Can't change password of account created using Google!");
            res.redirect("/login");
        } else if ( ( user.password_reset_expires && Math.abs(Date.now() - user.password_reset_expires + 86400000) < 3600000 ) || 
                    ( user.password_reset_last && Math.abs(Date.now() - user.password_reset_last) < 3600000 ) ) {
            req.flash("errorMessage", "You need to wait for 1 hour, before requesting the password reset link again.");
            res.redirect("/login");
        } else {
            crypto.randomBytes(5, async function (err, buf) {
                const reset_code = user._id + buf.toString('hex');
                user.password_reset_code = reset_code;
                user.password_reset_expires = Date.now() + 86400000;    // 24Hrs
                const reset_link = 'http://localhost:8080/account/password/reset/' + reset_code;

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

                const sender = process.env.MAIL_USER;
                const senderName = process.env.MAIL_NAME;
                const receiverName = user.firstName + " " + user.lastName;
                try {
                    await transporter.sendMail({
                        from: `${senderName} <${sender}>`, // sender address
                        to: `${receiverName} <${user.username}>`, // list of receivers
                        replyTo: `Do not reply to this mail. <noreply@apsitskills.com>`,
                        subject: "Password Reset - APSIT Alumni Portal", // Subject line
                        // text: '',
                        html: allTemplates.password_reset_mail(reset_link, receiverName)
                        
                    });
                    transporter.close();
                    user.save(function(err, user){
                        if(err) {
                            logger.error(err);
                            req.flash("errorMessage", "Something went wrong, please try again");
                            res.redirect("/login");
                        } else {
                            req.flash("successMessage", `The password reset link has been sent to ${user.username}, it will expire in 24 hours.`);
                            res.redirect('/login');

                            }
                        });
                } catch (err) {
                    logger.error(err);
                    req.flash("errorMessage", 'Something went wrong, please check your mails and try again!');
                    res.redirect("/login");
                }
                        
            });
        }
    });
});

router.get("/account/password/reset/:code", function (req, res) {
    res.render("password_reset", { code: req.params.code });
});

router.post("/account/password/reset/:code", function (req, res) {
    const code = req.params.code;
    const password = req.body.password;
    const redirect_back = "/account/password/reset/" + code;
    User.findOne({ password_reset_code: code }, "active", function(err, user) {
        if(err) {
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please again!");
            res.redirect(redirect_back);
        } else if (!user) {
            req.flash("errorMessage", "Invalid Password Reset Request!");
            res.redirect("/login");
        } else if (password.length < 6 || password.length > 20) {
            req.flash("errorMessage", "Password length must atleast 6 and atmost 20 characters.");
            res.redirect(redirect_back);
        } else if (user.active == true) {
            req.flash("errorMessage", "Activate your account first!");
            res.redirect("/login");
        } else {
            user.password_reset_code = "";
            user.password_reset_last = Date.now();
            user.setPassword(password, function() {
                user.save(function(err) {
                    if(err) {
                        logger.error(err);
                        req.flash("errorMessage", "Something went wrong, please again!");
                        res.redirect("/login");
                    } else {
                        req.flash("successMessage", "Password changed, login to continue.");
                        res.redirect('/login');
                    } 
                });
            });
        }
    });
});

/* change password */
router.post("/account/password/change", allMiddlewares.isLoggedIn, function(req, res) {
    if(req.body) {
        const oldPassword = req.body.oldpassword;
        const newPassword = req.body.password;
        User.findById(mongoose.Types.ObjectId(req.user._id), function(err, user) {
            if(err){
                logger.error(err);
                req.flash("errorMessage", "Something went wrong, please try again later.");
                res.redirect('/profile'); 
            } else if(oldPassword && newPassword && newPassword.length >= 6 && newPassword.length <= 20){
                user.changePassword(oldPassword, newPassword, function(err) {
                    if(err) {
                        if(err.name == "IncorrectPasswordError") {
                            req.flash("errorMessage", "Old password is not correct.");
                            res.redirect('/profile');
                        } else {
                            logger.error(err);
                            req.flash("errorMessage", "Something went wrong, please try again later.");
                            res.redirect('/profile');
                        }
                    } else {
                        req.flash("successMessage", "Password changed successfully.");
                        res.redirect('/profile');
                    }
                });
            } else if(newPassword.length<6) {
                req.flash("errorMessage", "Password is too short!");
                res.redirect("/profile");
            } else if(newPassword.length>=20) {
                req.flash("errorMessage", "Password is longer than 20 characers!");
                res.redirect("/profile");
            } else {
                req.flash("errorMessage", "Something went wrong, please try again later.");
                res.redirect('/profile');
            }
        });
    } else {
        req.flash("errorMessage", "Something went wrong, please try again later.");
        res.redirect("/profile");
    }
});

/* delete account */
router.get("/account/delete", allMiddlewares.rejectAdmin, function(req, res) {
    User.findByIdAndDelete(mongoose.Types.ObjectId(req.user._id), function(err) {
        if(err){
            logger.error(err);
            req.flash("errorMessage", "Something went wrong, please try again later.");
            res.redirect('/profile');
        } else {
            res.redirect("/logout");
        }
    });
});

/* admin panel - delete user */
router.post("/account/delete", allMiddlewares.isAdmin, function(req, res) {
    try {
        const userid = mongoose.Types.ObjectId(req.body.userid);

        User.findByIdAndDelete(mongoose.Types.ObjectId(userid), function (err) {
            if (err) {
                logger.error(err);
                res.send("Err");
            } else {
                res.send("Done")
            }
        });
    } catch (error) {
        logger.error(error);
        res.send("Exc");
    }
});

//////////////////////////////

// email routes
router.post('/mail',function(req, res, next) {
    if(req.body.message.length > 1000){
        res.send("Message is too big, no more than 1000 letters. You have " + req.body.message.length + " letters!");
    } else if (req.isAuthenticated()) {
        return next();
    } else res.send("Please Login First!");
} , async function(req, res) {
    let email = req.body.email;
    let original_user = req.user.username;
    let original_name = req.user.fullName;
    let subject = req.body.subject;
    let message = req.body.message;
    if(allMiddlewares.isValidEmail(email)) {
        let name = req.body.name,
        subject = req.body.subject,
        message = req.body.message;

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

        /* for own smtp */
        // {
        //     host: process.env.MAIL_HOST,
        //     port: process.env.MAIL_PORT,
        //     secure: process.env.MAIL_SECURE, // upgrade later with STARTTLS
        //     auth: {
        //         user: process.env.MAIL_USER,
        //         pass: process.env.MAIL_PASS
        //     }
        // };

        // send email
        let sender = process.env.MAIL_USER;
        let senderName = process.env.MAIL_NAME;
        try {
            await transporter.sendMail({
                from: `${senderName} <${sender}>`, // sender address
                to: sender, // list of receivers
                replyTo: `Do not reply to this mail. <noreply@apsitskills.com>`,
                subject: subject, // Subject line
                // text: message, // plain text body
                html: allTemplates.home_page_mail(name, email, subject, message, original_name, original_user),
              });
              transporter.close();
              res.send("OK")
        } catch (err) {
            logger.error(err);
            res.send("Something went wrong!!!");
        }
    } else {
        res.send("Invalid email entered!");
    }

});

module.exports = router;