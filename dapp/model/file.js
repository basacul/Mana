const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    fileName: String,
    file: String, // need to be replaced to upload real files
    note: String,
    shared: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("File", fileSchema);