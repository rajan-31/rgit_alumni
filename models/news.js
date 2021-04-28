const mongoose    = require("mongoose");

// news data
const newsSchema = new mongoose.Schema({
    title: String,
    date: Date,
    images: [String],
    thumbnail: String,
    description: String,
});

newsSchema.index( {date: -1, _id: 1} );

module.exports = mongoose.model("News", newsSchema);