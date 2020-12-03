const express = require("express");
const router = express.Router();

const Event = require("../models/events"); // not set

router.get("/events", isLoggedIn, function(req, res){
    res.render("Events/events");
});

// middleware - to check whether user is logged in or not
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


module.exports = router;