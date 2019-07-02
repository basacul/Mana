const express = require('express');
const router = express.Router(); // now instead of app, use router

router.get("/", isLoggedIn, function (req, res) {
    res.render("home");
});

/**
 * Our middleware for authoritisation and authentication
 */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/');
    }
}

module.exports = router;