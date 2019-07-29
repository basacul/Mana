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
    accessible: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    authorized: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Mana'
        }
    ]
});

module.exports = mongoose.model("File", fileSchema);