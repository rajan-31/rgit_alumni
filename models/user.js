const mongoose = require("mongoose"),
passportLocalMongoose = require("passport-local-mongoose");

const profileSchema = new mongoose.Schema({
    gender: String,
    yearOfAdmission: String,
    yearOfGraduation: String,
    branch: String,
    workExperience: {
        employer: [String],
        jobTitle: [String],
        jobDomain: [String],
        jobFrom: [String],
        jobTill: [String]
    },
    bio: String,
    skills: [String],
    dob: Date,
    address: {
        homeAddress: {
            addressLine1: String,
            country: String,
            zipcode: String
        },
        businessAddress: {
            addressLine1: String,
            country: String,
            zipcode: String
        }
    },
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
    receiveMsg: Boolean,
    profileImage: String,
    profile: {
        _id: false,
        type: profileSchema,
        default: {
            gender: "",
            yearOfAdmission: "",
            yearOfGraduation: "",
            branch: "",
            bio: "",
            dob: "",
            address: {
                homeAddress: {
                    addressLine1: "",
                    country: "",
                    zipcode: ""
                },
                businessAddress: {
                    addressLine1: "",
                    country: "",
                    zipcode: ""
                }
            },
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
    },
    chats: [
        {   _id: false,
            userid: mongoose.Schema.Types.ObjectId,
            username: String,
            messages: [
                {
                    _id: false,
                    who: Boolean,
                    msg: String,
                    timestamp: String
                }
            ]
        }
    ],
    order: [mongoose.Schema.Types.ObjectId],
    unread: [mongoose.Schema.Types.ObjectId],
    // account verified or not
    active: {
        type: Boolean,
        default: false
    },
    activation_code: String,
    activation_expires: Date,
    password_reset_code: String,
    password_reset_expires: Date,
    password_reset_last: Date,
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

userSchema.plugin(passportLocalMongoose, options);
module.exports = mongoose.model("User", userSchema);