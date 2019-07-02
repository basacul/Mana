const express = require('express');
const router = express.Router(); // now instead of app, use router
const passport = require('passport');
const User = require('../models/user');

router.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("home");
    } else {
        res.render('login');
    }
});

router.post("/login", passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/'
}), function (req, res) {
    // do nothing
});

/**
 * Handles user sign up
 */
router.post('/register', function (req, res) {
    User.register(new User({ username: req.body.username }), req.body.password, function (err, user) {
        if (err) {
            console.log('Error on sign up', err);
            res.redirect('/');
        } else {
            // we can change the strategy 'local' to 'twitter' or something else
            passport.authenticate('local')(req, res, function () {
                res.redirect('/home');
            });
        }
    });
});

router.get('/logout', isLoggedIn, function (req, res) {
    req.logout();
    res.redirect('/');
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