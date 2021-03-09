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
    //////////////////////////////////////////
    chats: [
        {   _id: false,
            userid: mongoose.Schema.Types.ObjectId,
            username: String,
            messages: [
                {
                    _id: false,
                    who: Boolean,
                    msg: String
                }
            ]
        }
    ],
    unread: [mongoose.Schema.Types.ObjectId]
    /////////////////////////////////////////
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);