const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    fileName: String,
    owner: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String
    },
    path: String, // replaced with path in folder structure
    note: String,
    shared: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("File", fileSchema);