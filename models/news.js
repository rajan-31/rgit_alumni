const mongoose    = require("mongoose");

// news data
const newsSchema = new mongoose.Schema({
    title: String,
    image: String,
    description: String
});
module.exports = mongoose.model("News", newsSchema);