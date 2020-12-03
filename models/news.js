const mongoose    = require("mongoose");

// news data
const newsSchema = new mongoose.Schema({
    title: String,
    date: Date,
    image: {
        data: Buffer,
        contentType: String
    },
    description: String,
});
module.exports = mongoose.model("News", newsSchema);