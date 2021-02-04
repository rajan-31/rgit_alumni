const mogoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

const adminSchema = new mogoose.Schema({
    username: String,
    password: String,
    createdBy: String,
    role: {
        type: String,
        default: "admin"
    }
});

adminSchema.plugin(passportLocalMongoose);
module.exports = mogoose.model("Admin", adminSchema);