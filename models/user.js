const mongoose = require('mongoose'),
    passportLocalMongoose = require('passport-local-mongoose');

// passportLocalMongoose takes care of the hashing and salt, such that we do 
// not need to store 'password' in the database

const userSchema = new mongoose.Schema({
    username: String, // TODO: store keccak(username) such that identity is not stored on the database
	email: String, // TODO: Protect it but used for verification and resets
	active: Boolean, 
	token: String,
    /* password: String, // TODO: store keccak(password) */
    // TODO: files are encrypted with password
    files: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File"
        }
    ],
    publicKey_user: { type: String, default: null }, // TODO: store encrypted with password
    privateKey_user: { type: String, default: null }, // TODO: store encrypted with password
    privateKey_mana: { type: String, default: null } // TODO: store encrypted with password
});

// takes the passport-local package and adds a bunch of methods
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);