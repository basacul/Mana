const express = require('express');
const router = express.Router(); // now instead of app, use router
const passport = require('passport');
const User = require('../models/user');
const middleware = require('../middleware');

// to create the necessary folder structures
const fs = require('fs');
const dir = 'encrypted/users';

router.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("home");
    } else {
        res.render('login');
    }
});


router.post("/login", passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/',
    failureFlash: true,
    successFlash: `Welcome back!`
}), function (req, res) {
    // do nothing
});

router.get('/signup', function (req, res) {

    if (!req.isAuthenticated()) {
        res.render('signup');
    } else {
        req.flash('error', 'Sign up only accessible if not logged in.');
        res.redirect('/home');
    }
});
/**
 * Handles user sign up
 */
router.post('/signup', function (req, res) {
    User.register(new User({ username: req.body.username }), req.body.password, function (err, user) {
        if (err) {
            console.log('Error on sign up', err);
            req.flash('error', err.message);
            res.redirect('/signup');
        } else {

            fs.mkdir(`${dir}/${req.body.username}`, { recursive: true }, (err) => {
                if (err) {
                    req.flash('error', err.message);
                    throw err;
                }
            });
            // we can change the strategy 'local' to 'twitter' or something else. THis redirects user
            // indirectly to /home as authenticated
            // passport.authenticate('local')(req, res, function () {
            //     res.redirect('/');
            // });
            req.flash('success', 'Please check your email and follow the instructions.');
            res.redirect('/');
        }
    });
});

router.get('/logout', middleware.isLoggedIn, function (req, res) {
    req.logout();
    req.flash('success', 'Successfully logged you out');
    res.redirect('/');
});


module.exports = router;