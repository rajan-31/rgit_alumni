const mongoose    = require("mongoose");

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true
    }
});

module.exports = mongoose.model("Newsletter", newsletterSchema);