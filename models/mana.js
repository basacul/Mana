const mongoose = require('mongoose');

/**
 * Mana holds the public key for the mana ecosystem of the respective
 * user. In addition, it stores the ethereum address with which the transactions
 * are performed
 */
const manaSchema = new mongoose.Schema({
    publicKey_mana: { type: String, default: null },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    participant: { type: String, default: null } // participant id in hlf
});

module.exports = mongoose.model('Mana', manaSchema);