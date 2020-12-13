// middleware - to check whether admin is logged in or not
let allMiddlewares={};

allMiddlewares.isAdmin = function (req, res, next) {
    if (req.isAuthenticated() && req.user.role == "admin") {
        return next();
    }
    req.flash("errorMessage", "Please, Login First");
    res.redirect("/admin/login");
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

module.exports = allMiddlewares;