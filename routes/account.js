const express = require('express');
const router = express.Router(); // now instead of app, use router
const middleware = require('../middleware');
const User = require('../models/user');
const File = require('../models/file');
const Privacy = require('../models/privacy');
const mailer = require('../util/mailer');
const template = require('../util/templates');
const winston = require('../config/winston');

// email_for_dev should be replaced with user.email, but with MailGun I can only send mails to myself, yet
const email_for_dev = 'antelo.b.lucas@gmail.com';

// to remove the folders if the user wants to delete account
const fs = require('fs'); 
const dir = 'encrypted/users';
const deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

router.get("/", middleware.isLoggedIn, function (req, res) {
	Privacy.findOne({user: req.user._id}, (err, privacy) => {
		if(err){
			winston.error()
			req.flash('error', 'Please try later...');
			res.redirect('/home');
		}else{
			 res.render("app/account", {privacy: privacy});
		}
	})
   
});

router.put("/password", middleware.isLoggedIn, (req, res)=> {
	
	User.findById(req.user._id, function(err, user){
		if(err){
			winston.error(err.message);
			req.flash('error', 'Something went wrong. Try again later.');
			res.redirect('back');
		} else if(!user){
			winston.error('Logged in user not found when resetting the password');
			req.flash('error', 'Your account not found.');
			res.redirect('back');
		}else{
			if(req.body.passwordNew === req.body.passwordConfirmation){
				user.changePassword(req.body.passwordCurrent, req.body.passwordNew, function(err) {
					
					if(err) {
						
						if(err.name === 'IncorrectPasswordError'){
							
							req.flash('error', 'Incorrect password' ); // Return error
							
						}else {
							
							req.flash('error', 'Please try again after sometimes.');

						}
					} else {
						winston.info('A new password has been set by a user.');
						req.flash('success','Your password has been updated.' );
					}
					
					res.redirect('back');
					
				});
			}else{
				
				req.flash('error', 'Confirmation password mismatch.');
				res.redirect('back');
				
			}
			
			
		}
	});	
});

router.put("/privacy", middleware.isLoggedIn, (req, res)=> {
	let privacy_settings = sanitize_privacy(req);
	
	
	Privacy.findOneAndUpdate({user: req.user._id}, privacy_settings, (err, privacy) => {
		if(err){
			winston.error(err.message);
			req.flash('error', 'Could not update privacy settings.');
		}else{
			winston.info('Privacy settings were updated.');
			req.flash('success', 'Privacy settings updated.');
		}
		res.redirect('/account');
	})
	
	
});

router.post('/token', middleware.isLoggedIn, (req, res) => {

	const html = template.token(req.user.username, req.user.email, req.user.token);

	mailer.sendEmail('donotreply@openhealth.care', email_for_dev, 'Your current token', html);
	winston.info('The current token was requested by a user.');
	req.flash('success', `Token sent to ${req.user.email}`);
	res.redirect('back');	
	
});

// TODO: Implement the logic to correctly handle the data request
router.post('/data', middleware.isLoggedIn, (req,res) => {
	const wantsSummary = sanitize_data_request(req);
	
	if(wantsSummary){
		winston.info('A data request was performed asking for a summary.');
	}else{
		winston.info('A data request was performed asking full disclosure.');
	}
	
	const html = template.data(req.user.username, req.user.email, wantsSummary);
	
	mailer.sendEmail('donotreply@openhealth.care', email_for_dev, 'Your data request', html);
	
	req.flash('success', 'Your request will be processed.');
	res.redirect('back');
});

router.delete('/delete', middleware.isLoggedIn,  (req,res) => {
	
	User.findOneAndRemove({token: req.body.token}, (err, user) => {
		console.log(user);
		if (err) {
			winston.error(err.message);
			req.flash('error', 'Something went wrong with account.');
			res.redirect('back');
		}else{
			if(!user){
				req.flash('error', 'Please provide the correct token.');
				res.redirect('back');
			}else{
				Privacy.findOneAndRemove({user: user._id}, (err, privacy) => {
					if(err){
						winston.error(err.message);
					}
				});
				
				File.deleteMany({ owner : {id: user._id, username: user.username} }, function (err) {
					if(err){
						winston.error(err.message);
						req.flash('error', 'Something went wrong with files.');
						return res.redirect('back');
					}else{
						const path = `${dir}/${req.user.username}`;
						deleteFolderRecursive(`${dir}/${req.user.username}`);
						req.flash('success', 'Your account and files were deleted.');
						req.logout();
						winston.info('A user profile was deleted and logged out.');
						res.redirect('/');
					}
				});
				
			}
			
			
		} 
	});
});

function sanitize_privacy(req) {
	if(req.body.privacy){
		req.body.privacy.notify = req.body.privacy.notify ? true : false;
		req.body.privacy.personalize = req.body.privacy.personalize ? true : false;
		req.body.privacy.research = req.body.privacy.research ? true : false;
		req.body.privacy.providers = req.body.privacy.providers ? true : false;
		req.body.privacy.insurance = req.body.privacy.insurance ? true : false;
		return req.body.privacy;
	}else{
		return {notify: false, personalize: false, research: false, providers: false, insurance: false};
	}

}

function sanitize_data_request(req){
	req.body.summary = req.body.summary ? true : false;
	return req.body.summary;
}

module.exports = router;