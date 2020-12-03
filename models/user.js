const mongoose = require("mongoose"),
passportLocalMongoose = require("passport-local-mongoose");

const profileSchema = new mongoose.Schema({
    gender: String,
    yearOfAdmission: String,
    yearOfGraduation: String,
    branch: String,
    bio: String,
    skills: [String],
    dob: Date,
    contact: {
        mobile: String,
        email: String
    },
    social_media: {
        linkedin: String,
        instagram: String,
        website: String
    }
});

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName : String,
    username: String,
    googleId: String,
    password: String,
    userType: String,
    profileImage: {
        data: Buffer,
        contentType: String
    },
    profile: {
        type: profileSchema,
        default: {
            gender: "",
            yearOfAdmission: "",
            yearOfGraduation: "",
            branch: "",
            bio: "",
            dob: "",
            contact: {
                mobile: "",
                email: ""
            },
            social_media: {
                linkedin: "",
                instagram: "",
                website: ""
            }
        }
    }
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);