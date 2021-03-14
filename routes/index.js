const express = require("express");
const router = express.Router();
const passport = require("passport");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const User  = require("../models/user"),
      News  = require("../models/news"),
      Event = require("../models/event");

const allMiddlewares = require("../middleware/index.js");
const allTemplates = require("../services/mail_templates")

router.get("/",function(req, res){
    // News.find({}, { images: { $slice: 1 } }, function (err, allNews) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         Event.find({}, { images: { $slice: 1 } }, function (err, allEvents) {
    //             if (err) {
    //                 console.log(err);
    //             } else if(req.isAuthenticated()) {
    //                 res.render("Home/home", { news: allNews, events: allEvents, dataFromFile: global.static_data });
    //             } else {
    //                 res.render("Home/guest", { news: allNews, events: allEvents, dataFromFile: global.static_data });
    //             }
    //         }).sort({ date: -1 }).limit(3).lean();
    //     }
    // }).sort({ date: -1 }).limit(3).lean();
    res.render("Home/guest", { news: [], events: [], dataFromFile: global.static_data });
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
                    req.flash("errorMessage", "Email already taken, please try different Email.");
                    res.redirect("/signup");
                } else{
                    console.log(err);
                    req.flash("errorMessage", "Something went wrong, please try again");
                    res.redirect("/signup");
                }
            } else{
                crypto.randomBytes(5, async function (err, buf) {
                    const activation_code = user._id + buf.toString('hex');
                    user.activation_code = activation_code;
                    user.activation_expires = Date.now() + 2 * 24 * 3600 * 1000;    // 48Hrs
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
                                console.log(err);
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
                        console.log(err);
                        req.flash("errorMessage", 'Something went wrong, please try again. If you get "Email already taken", then check your mail for activation link or generate a new one on login page.');
                        res.redirect("/signup");
                    }
                            
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
        res.redirect('/profile')
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
            console.log(err);
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
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect("/login");
        } else {
            if(data.active == false && data.activation_expires > Date.now()) {
                User.findByIdAndUpdate(data._id, { active: true}, function(err) {
                    if(err) {
                        console.log(err);
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
                req.flash("errorMessage", "Account activation code is expired, please generate new one.");
                res.redirect("/login");
            }
        }
    }).lean();
});

router.post('/account/activate/resend', function(req, res) {
    const resend_to = req.body.username;
    User.findOne({ username: resend_to}, 'active activation_code firstName lastName', async function(err, data) {
        if (err) {
            console.log(err);
            req.flash("errorMessage", "Something went wrong, please try again.");
            res.redirect("/login");
        } else if(!data) {
            req.flash("errorMessage", "No account found with given email, please check your email or create a new one.");
            res.redirect("/login");
        } else if (data.active == true) {
            req.flash("successMessage", "Account already activated, login to continue.");
            res.redirect("/login");
        } else {
            data.activation_expires = Date.now() + 2 * 24 * 3600 * 1000;
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

            let sender = process.env.MAIL_USER;
            let senderName = process.env.MAIL_NAME;
            try {
                await transporter.sendMail({
                    from: `${senderName} <${sender}>`, // sender address
                    to: `${data.firstName} ${data.lastName} <${resend_to}>`, // list of receivers
                    replyTo: `Do not reply to this mail. <noreply@apsitskills.com>`,
                    subject: "Email Verification - APSIT Alumni Portal", // Subject line
                    // text: '',
                    html: allTemplates.activation_mail(activation_link)
                    
                });
                transporter.close();
                data.save(function(err, data){
                    if(err) {
                        console.log(err);
                        req.flash("errorMessage", "Something went wrong, please try again");
                        res.redirect("/login");
                    } else {
                            req.flash("successMessage", `The activation email has been sent to ${resend_to}, please click the activation link within 48 hours.`);
                            res.redirect('/login');
                        }
                });

            } catch (err) {
                console.log(err);
                req.flash("errorMessage", "Something went wrong, please check your mails and try again!");
                res.redirect("/login");
            }
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
            console.log(err);
            res.send("Something went wrong!!!");
        }
    } else {
        res.send("Invalid email entered!");
    }

});


module.exports = router;