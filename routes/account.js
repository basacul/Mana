const express = require('express');
const router = express.Router(); // now instead of app, use router
const middleware = require('../middleware');
const User = require('../models/user');
const File = require('../models/file');
const mailer = require('../misc/mailer');
const template = require('../misc/templates');

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
    res.render("app/account");
});

router.put("/password", middleware.isLoggedIn, (req, res)=> {
	
	User.findById(req.user._id, function(err, user){
		if(!user){
			
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

router.put("/gdpr", middleware.isLoggedIn, (req, res)=> {
	req.flash('success', 'GDPR options updated.');
	res.redirect('/account');
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



module.exports = router;