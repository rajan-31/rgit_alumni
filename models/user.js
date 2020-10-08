const mogoose = require("mongoose"),
passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mogoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
module.exports = mogoose.model("User", userSchema);