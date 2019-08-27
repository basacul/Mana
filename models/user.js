const mongoose = require('mongoose'),
    passportLocalMongoose = require('passport-local-mongoose');

// passportLocalMongoose takes care of the hashing and salt, such that we do 
// not need to store 'password' in the database

const userSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true }, // TODO: store keccak(username) such that identity is not stored on the database
	email: {type: String, unique: true, required: true}, // TODO: Protect it but used for verification and resets
	active: Boolean, 
	token: String,
    // TODO: files are encrypted with password
    files: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File"
        }
    ]
});

// takes the passport-local package and adds a bunch of methods
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);