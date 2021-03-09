// middleware - to check whether admin is logged in or not
let allMiddlewares={};

allMiddlewares.isAdmin = function (req, res, next) {
    if (req.isAuthenticated() && req.user.role == "admin") {
        return next();
    } else {
        req.flash("errorMessage", "Please, Login First");
        res.redirect("/admin/login");
    }
};

// reject admin from accessing
allMiddlewares.rejectAdmin = function (req, res, next) {
    if (req.isAuthenticated() && req.user.role != "admin") {
        return next();
    } else if( req.isAuthenticated() && req.user.role == "admin" ) {
        req.flash("errorMessage", "Admins can't Access that page!");
        res.redirect("/");
    } else {
        req.flash("errorMessage","Please, Login First");
        res.redirect("/login");
    }
};

// middleware - to check whether user is logged in or not
allMiddlewares.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else{
        req.flash("errorMessage","Please, Login First");
        res.redirect("/login");
    }
};

allMiddlewares.isValidEmail = function( email ) {
    const mailformat = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return mailformat.test(email.toLowerCase()) ;
};

module.exports = allMiddlewares;