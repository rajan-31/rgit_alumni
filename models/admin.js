const mogoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

const adminSchema = new mogoose.Schema({
    username: String,
    password: String,
    createdBy: String,
    role: {
        type: String,
        default: "admin"
    },
    active: {
        type: Boolean,
        default: false
    }
});

const options = {
    usernameLowerCase: true,
    limitAttempts: true,
    maxAttempts: 100,
    // interval: 1000 * 60 * 0.1,
    // maxInterval: 1000 * 60 * 0.1,
    attemptsField: "failedLoginAttempts",
    lastLoginField: "lastLogin"
}

adminSchema.plugin(passportLocalMongoose, options);
module.exports = mogoose.model("Admin", adminSchema);