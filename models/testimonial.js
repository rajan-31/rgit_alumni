const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    branch: String,
    content: String,
    image: String
});

module.exports = mongoose.model("Testimonial", testimonialSchema);
