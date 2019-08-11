const mongoose = require('mongoose');

const privacySchema = new mongoose.Schema({
    user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
    notify: { type: Boolean, default: false },
	personalize:  { type: Boolean, default: false },
	research:  { type: Boolean, default: false },
	providers:  { type: Boolean, default: false },
	insurance:  { type: Boolean, default: false }
});

module.exports = mongoose.model("Privacy", privacySchema);