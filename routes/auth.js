const express = require('express');
const router = express.Router(); // now instead of app, use router
const passport = require('passport');
// TODO: replace cryptoRandomString with crypto!!
const cryptoRandomString = require('crypto-random-string'); // to generate verification token
const mailer = require('../misc/mailer');
const template = require('../misc/templates');
const User = require('../models/user');
const middleware = require('../middleware');

// email_for_dev should be replaced with user.email, but with MailGun I can only send mails to myself, yet
const email_for_dev = 'antelo.b.lucas@gmail.com';

// to create the necessary folder structures
const fs = require('fs');
const dir = 'encrypted/users';

router.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("home");
    } else {
        res.render('auth/login');
    }
});

// perform simple promise procedure to test for inactivity
router.post("/login", middleware.isVerified, passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/',
    failureFlash: true,
    successFlash: `Welcome back!`
}), function (req, res) {
	// do nothing. code below just saved if I want to use it in another request
	
	// we can change the strategy 'local' to 'twitter' or something else. THis redirects user
	// indirectly to /home as authenticated
	// passport.authenticate('local')(req, res, function () {
	//     res.redirect('/');
	// });
});

router.get('/register', function (req, res) {
    if (!req.isAuthenticated()) {
        res.render('auth/register');
    } else {
        req.flash('error', 'Registration only accessible if not logged in.');
        res.redirect('/home');
    }
});

/**
 * Handles user sign up
 */
router.post('/register', function (req, res) {
	// check, that a username and email is not already taken
    User.register(new User({ username: req.body.username, email: req.body.email, active: false }), req.body.password, function (err, user) {
        if (err) {
            console.log('Error on sign up', err);
			if(err.message.includes('email')){
				req.flash('error', 'Please, provide a different email.'); // as the err message is too abstract
			}else{
				req.flash('error', err.message);
			}
            
            res.redirect('/register');
        } else {
			
            fs.mkdir(`${dir}/${req.body.username}`, { recursive: true }, (err) => {
                if (err) {
                    req.flash('error', err.message);
                    throw err;
                }
            });

			
			// 1. generate secret token 
			user.token = cryptoRandomString({length: 32, type: 'base64'});
			user.save();
			
			// 2. compose the email
			const html = template.verification(user.username, user.email, user.token);

			
			// 3. and send email. this function returns a promise
			mailer.sendEmail('registration@openhealth.care', email_for_dev, 'Verify your account', html);
			
            req.flash('success', 'Please check your email and follow the instructions to input verification token.');
            res.redirect('/verification');
        }
    });
});


// allows user to verify with a secret token
router.get('/verification', (req,res) => {
	if (req.isAuthenticated()) {
        res.redirect("home");
    } else {
        res.render('auth/verification');
    }
});

// to process the secret token and activate the user
router.post('/verification', (req, res) => {

	User.findOne({token: req.body.token}, function(err, user){
		if(!user){
			
			req.flash('error', 'Please make sure your token is correct.');
			res.redirect('/verification');
			
		}else{
			
			if(user.active){
				
				req.flash('success', 'Your account has already been verified. Please log in.');
				res.redirect('/');
				
			}else{

				if(user.username === req.body.username){
					user.active = true;
					user.save();
					req.flash('success', `Verification successful. You can now log in.`);
					res.redirect('/');
				}else{
					req.flash('error', 'Please make sure your username is correct.');
					res.redirect('/verification');
				}
				
			}
			
		}
	});
});

// page to recover lost passwords
router.get('/password', (req, res) => {
	if (req.isAuthenticated()) {
        res.redirect("home");
    } else {
        res.render('auth/password');
    }
});


// request new password 
router.post('/password', (req, res) => {

	
	User.findOne({username: req.body.username}, function(err, user){
		if(!user){
			
			req.flash('error', 'Please make sure your username is correct.');
			res.redirect('/password');
			
		}else{
			
			if(req.body.token === user.token && req.body.email === user.email){

				// 2. compose the email without token as token is correct
				const html = template.reset(user.username, user.email, "");

				// 3. and send email. this function returns a promise
				mailer.sendEmail('donotreply@openhealth.care', email_for_dev, 'Reset your password', html);
				
				req.flash('success', 'You will shortly receive an email to set a new password');
				res.redirect('/reset');
				
			}else{
				if(user.token === req.body.token){
					req.flash('error', `Please enter your email used for this account.`);
					res.redirect('/password');
				}else if(req.body.email === user.email){
					
					// 1. generate new secret token
					user.token = cryptoRandomString({length: 32, type: 'base64'});
					// TODO: HOW TO MAKE PREVIOUS PASSWORD UNUSABLE
					user.active = false;
					user.save();
					
					const html = template.reset(user.username, user.email, user.token);
					mailer.sendEmail('donotreply@openhealth.care', email_for_dev, 'Reset your password', html);
					
					req.flash('success', 'You are account is blocked and you will shortly receive an email with a new verification token to set a new password');
					res.redirect('/reset');
				}else{
					req.flash('error', 'Please make sure, that your token or email is correct.');
					res.redirect('/password');
				}
				
			}
			
		}
	});
});

// get reset password page
router.get('/reset', (req, res) => {
	if (req.isAuthenticated()) {
        res.redirect("/home");
    } else {
        res.render('auth/reset');
    }
});

// post credentials for getting a new password
router.post('/reset', (req, res) => {
	User.findOne({token: req.body.token}, function(err, user){
		if(!user){
			
			req.flash('error', 'Please make sure your token is correct.');
			res.redirect('/reset');
			
		}else{
			
			if(user.username === req.body.username){
				if(req.body.password === req.body.passwordConfirmation){
					
					user.setPassword(req.body.password, err => {
						if(err){
							req.flash('error', 'New password could not be set by our application.');
							return res.redirect('/');
						}else{
							user.save();
						}
					});
					user.active = true;
					user.save();
					req.flash('success', `Password reset was successful. You can now log in.`);
					res.redirect('/');
				}else{
					req.flash('error', 'Please make sure your password and password confirmation are the same.');
					res.redirect('/reset');
				}
				
			}else{
				req.flash('error', 'Please make sure your username is correct.');
				res.redirect('/reset');
			}
			
			
		}
	});
});

router.get('/logout', middleware.isLoggedIn, function (req, res) {
    req.logout();
    req.flash('success', 'Successfully logged you out');
    res.redirect('/');
});

router.get('/contact', (req, res) =>{
	res.render('auth/contact');
});

router.post('/contact', (req,res) => {
	// TODO: check if a correct email was given
	console.log(req.body.email);
	console.log(req.body.message);
	req.flash('success', 'Your message has been received and we will soon answer you.');
	res.redirect('/');
});

module.exports = router;