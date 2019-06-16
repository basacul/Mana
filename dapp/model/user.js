const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String, // should store keccak(username)
    password: String, // should store keccak(password)
    files: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File"
        }
    ],
    publicKey_user: String, // should store encrypted with password
    privateKey_user: String, // should store encrypted with password
    privateKey_mana: String // should store encrypted with password
});

module.exports = mongoose.model("User", userSchema);