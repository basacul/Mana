const express = require('express');
const router = express.Router(); // now instead of app, use router
const middleware = require('../middleware');
const User = require('../models/user');
const File = require('../models/file');
const Privacy = require('../models/privacy');
const mailer = require('../misc/mailer');
const template = require('../misc/templates');
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
			req.flash('error', 'Please try later...');
			res.redirect('/home');
		}else{
			 res.render("app/account", {privacy: privacy});
		}
	})
   
});

router.put("/password", middleware.isLoggedIn, (req, res)=> {
	
	User.findById(req.user._id, function(err, user){
		if(!user){
			winston.error('Set new password: User not found');
			req.flash('error', 'Your account not found.');
			res.redirect('back');
			
		}else{
			if(req.body.passwordNew === req.body.passwordConfirmation){
				user.changePassword(req.body.passwordCurrent, req.body.passwordNew, function(err) {
					
					if(err) {
						
						if(err.name === 'IncorrectPasswordError'){
							winston.info(`Incorrect Password for setting a new password by user ${req.user.username}`);
							
							req.flash('error', 'Incorrect password' ); // Return error
							
						}else {
							
							req.flash('error', 'Please try again after sometimes.');

						}
					} else {
						
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
	
	console.log(req.body.privacy);

	
	Privacy.findOneAndUpdate({user: req.user._id}, privacy_settings, (err, privacy) => {
		if(err){
			req.flash('error', 'Could not update privacy settings.');
		}else{
			console.log(`Privacy object: ${privacy}`);
			req.flash('success', 'Privacy settings updated.');
		}
		res.redirect('/account');
	})
	
	
});

router.post('/token', middleware.isLoggedIn, (req, res) => {

	const html = template.token(req.user.username, req.user.email, req.user.token);

	mailer.sendEmail('donotreply@openhealth.care', email_for_dev, 'Your current verification token', html);
	
	req.flash('success', `Token sent to ${req.user.email}`);
	res.redirect('back');	
	
});

router.post('/data', middleware.isLoggedIn, (req,res) => {
	req.flash('success', 'Your data will be sent.');
	res.redirect('back');
});

router.delete('/delete', middleware.isLoggedIn,  (req,res) => {
	
	console.log('entering');
	User.findOneAndRemove({token: req.body.token}, (err, user) => {
		console.log(user);
		if (err) {
			console.log("ERROR WHEN DELETING USER ", err);
			req.flash('error', 'Something went wrong with account.');
			res.redirect('back');
		}else{
			if(!user){
				req.flash('error', 'Please provide the correct token.');
				res.redirect('back');
			}else{
				Privacy.findOneAndRemove({user: user._id}, (err, privacy) => {
					if(err){
						console.log(`Could not delete privacy setting for ${user._id}`);
					}
				});
				
				File.deleteMany({ owner : {id: user._id, username: user.username} }, function (err) {
					if(err){
						req.flash('error', 'Something went wrong with files.');
						return res.redirect('back');
					}else{
						const path = `${dir}/${req.user.username}`;
						deleteFolderRecursive(`${dir}/${req.user.username}`);
						req.flash('success', 'Your account and files were deleted.');
						req.logout();
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

module.exports = router;