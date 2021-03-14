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
}

adminSchema.plugin(passportLocalMongoose, options);
module.exports = mogoose.model("Admin", adminSchema);