const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
    key: {
        type: String,
        unique: true
    },
    value: {
        youtubeURL: String,
        students: String,
        studentsProgress: String,
        alumni: String,
        alumniProgress: String
    }
},
{ collection: 'data' });

module.exports = mongoose.model("Data", dataSchema);