const mongoose    = require("mongoose");

// showcase data
const showcaseSchema = new mongoose.Schema({
    title: String,
    image: String
});
// const Showcase = mongoose.model("Showcase", showcaseSchema);

module.exports = mongoose.model("Showcase", showcaseSchema);