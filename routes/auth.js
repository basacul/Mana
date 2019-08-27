const express = require('express');
const router = express.Router(); // now instead of app, use router
const passport = require('passport');
// TODO: replace cryptoRandomString with crypto!!
const cryptoRandomString = require('crypto-random-string'); // to generate verification token
const mailer = require('../utils/mailer');
const template = require('../utils/templates');
const User = require('../models/user');
const Privacy = require('../models/privacy');
const Mana = require('../models/mana');
const middleware = require('../middleware');
const winston = require('../config/winston');

// email_for_dev should be replaced with user.email, but with MailGun I can only send mails to myself, yet
const email_for_dev = 'antelo.b.lucas@gmail.com';

// to create the necessary folder structures
const dir = 'temp';

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
            winston.error(err.message);
			if(err.message.includes('email')){
				req.flash('error', 'Please, provide a different email.'); // as the err message is too abstract
			}else{
				req.flash('error', err.message);
			}
            
            res.redirect('/register');
        } else {
					
			// Create Privacy DB OBject
			Privacy.create({user: user._id}, (err, privacy) => {
				if(err){
					winston.error(err.message);
					console.log('Something went wrong when creating a new privacy object.');
				}else{
					winston.info('A new privacy object created upon registration.');
					console.log('Privacy object created with: ');
					console.log(privacy);
				}
			});
			
			
			// 1. generate secret token 
			user.token = cryptoRandomString({length: 32, type: 'base64'});
			user.save();
			
			// 2. compose the email
			const html = template.verification(user.username, user.email, user.token);

			
			// 3. and send email. this function returns a promise
			// mailer.sendEmail('registration@openhealth.care', email_for_dev, 'Verify your account', html);
			mailer.sendEmail('registration@openhealth.care', user.email, 'Verify your account', html).then(info => {
				winston.info('Email for verification sent.');
			}).catch(error => {
				winston.error('Error when sending email for verification.');
				console.log(error.message);
				req.flash('error', 'Email could not be sent.');
			});
			
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
		if(err){
			winston.error(err.message);
			req.flash('error', 'Something went wrong. Try again later.');
			res.redirect('back');
		}if(!user){
			
			req.flash('error', 'Please make sure your token is correct.');
			res.redirect('/verification');
			
		}else{
			
			if(user.active){
				
				winston.info('User account was verified.');
				req.flash('success', 'Your account has already been verified. Please log in.');
				res.redirect('/');
				
			}else{

				if(user.username === req.body.username){
					user.active = true;
					user.save();
					
					// TODO: Create participant in Hyperledger Fabric and store the appropriate participant in mana
					Mana.create({user: user._id}, (err, mana) => {
						if(err){
							winston.error(err.message);
							console.log('Something went wrong when creating a new mana object.');
						}else{
							winston.info('A new mana object created upon registration.');
							console.log('Privacy object created with: ');
							console.log(mana);
						}
					});
					
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
		if(err){
			winston.error(err.message);
			req.flash('Something went wrong. Try again later.');
			res.redirect('back');
		}else if(!user){
			
			req.flash('error', 'Please make sure your username is correct.');
			res.redirect('/password');
			
		}else{
			
			if(req.body.token === user.token && req.body.email === user.email){

				// 2. compose the email without token as token is correct
				const html = template.reset(user.username, user.email, "");

				// 3. and send email. this function returns a promise
				// mailer.sendEmail('donotreply@openhealth.care', email_for_dev, 'Reset your password', html);
				mailer.sendEmail('donotreply@openhealth.care', user.email, 'Reset your password', html).then(info => {
					winston.info('Password change request from auth.js by a user with a token.');
				}).catch(error => {
					winston.error('Error when sending email for password reset');
					console.log(error.message);
					req.flash('error', 'Email could not be sent.');
				});
				
				winston.info('Password change request from auth.js by a user with a valid token.');
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
					// mailer.sendEmail('donotreply@openhealth.care', email_for_dev, 'Reset your password', html);
					mailer.sendEmail('donotreply@openhealth.care', user.email, 'Reset your password', html).then(info => {
						winston.info('Password change request from auth.js by a user without a token.');
					}).catch(error => {
						winston.error('Error when sending email for password reset');
						console.log(error.message);
						req.flash('error', 'Email could not be sent.');
					});
					
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
		if(err){
			winston.error(err.message);
			req.flash('error', 'Something went wrong. Try again later.');
		}else if(!user){
			
			req.flash('error', 'Please make sure your token is correct.');
			res.redirect('/reset');
			
		}else{
			
			if(user.username === req.body.username){
				if(req.body.password === req.body.passwordConfirmation){
					
					user.setPassword(req.body.password, err => {
						if(err){
							winston.error(err.message);
							req.flash('error', 'New password could not be set by our application.');
							return res.redirect('/');
						}else{
							user.active = true;
							user.save();
						}
					});

					winston.info('Password reset succesfully performed by a user.');
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
	winston.info('A message was sent from the contact form from a not logged in user.');
	req.flash('success', 'Your message has been received and we will soon answer you.');
	res.redirect('/');
});

module.exports = router;