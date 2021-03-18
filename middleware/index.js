// middleware - to check whether admin is logged in or not
let allMiddlewares={};

allMiddlewares.isAdmin = function (req, res, next) {
    if (req.isAuthenticated() && req.user.role == "admin" ) { /* && req.user.active == true //for future use*/
        return next();
    } else {
        req.flash("errorMessage", "Please, Login First!");
        res.redirect("/admin/login");
    }
};

// reject admin from accessing
allMiddlewares.rejectAdmin = function (req, res, next) {
    if (req.isAuthenticated() && req.user.role != "admin" && req.user.active == true) {
        return next();
    } else if( req.isAuthenticated() && req.user.role == "admin" ) {
        req.flash("errorMessage", "Admins can't Access that page!");
        res.redirect("/");
    } else if ( req.isAuthenticated() && req.user.active != true) {
        req.flash("errorMessage",`Please, first activate your account by clicking link sent on your mail ${req.user.username}`);
        res.redirect("/login");
    } else {
        req.flash("errorMessage","Please, Login First!");
        res.redirect("/login");
    }
};

// middleware - to check whether user is logged in or not
allMiddlewares.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated() && req.user.active == true) {
        return next();
    } else if (req.isAuthenticated() && req.user.active != true) {
        req.flash("errorMessage",`Please, first activate your account by clicking link sent on your mail ${req.user.username}`);
        res.redirect("/login");
    } else {
        req.flash("errorMessage","Please, Login First!");
        res.redirect("/login");
    }
};

allMiddlewares.isValidEmail = function( email ) {
    const mailformat = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return mailformat.test(email.toLowerCase()) ;
};

module.exports = allMiddlewares;