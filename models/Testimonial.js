const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema({
    name: String,
    branch: String,
    content: String,
    image: {
        data: Buffer,
        contentType: String
    }
});

module.exports = mongoose.model("Testimonial", testimonialSchema);