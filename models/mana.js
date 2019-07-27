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
    eth: { type: String, default: null } // ethereum address
})

module.exports = mongoose.model('Mana', manaSchema);