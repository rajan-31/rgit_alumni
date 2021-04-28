const mongoose = require("mongoose");

// news data
const eventSchema = new mongoose.Schema({
    title: String,
    date: Date,
    images: [String],
    thumbnail: String,
    description: String,
});

eventSchema.index( { date: -1, _id: 1 } );

module.exports = mongoose.model("Event", eventSchema);