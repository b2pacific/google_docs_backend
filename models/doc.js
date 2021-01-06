const mongoose = require("mongoose");

const doc = new mongoose.Schema({
    Id: {
        type: String,
        required: true
    },
    content: {
        type: String
    },
    password: {
        type: String
    },
    last_accessed: {
        type: Date,
        default: Date.now()
    }
})

const model = mongoose.model("Doc", doc);
export default model;