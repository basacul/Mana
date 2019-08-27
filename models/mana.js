const mongoose = require('mongoose');

/**
 * Mana holds the public key for the mana ecosystem of the respective
 * user. In addition, it stores the ethereum address with which the transactions
 * are performed
 */
const manaSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    participant: { type: String, default: null } // participant id in hlf, but not needed yet
});

module.exports = mongoose.model('Mana', manaSchema);