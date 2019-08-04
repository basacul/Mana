const express = require('express');
const router = express.Router(); // now instead of app, use router
const middleware = require('../middleware');
const User = require('../models/user');

router.get("/", middleware.isLoggedIn, function (req, res) {
    res.render("app/account");
});

router.put("/", middleware.isLoggedIn, (req, res)=> {
	
	User.findById(req.user._id, function(err, user){
		if(!user){
			
			req.flash('error', 'We could not find your entry in the database.');
			res.redirect('back');
			
		}else{
			if(req.body.passwordNew === req.body.passwordConfirmation){
				user.changePassword(req.body.passwordCurrent, req.body.passwordNew, function(err) {
					
					if(err) {
						
						if(err.name === 'IncorrectPasswordError'){
							
							req.flash('error', 'Incorrect password' ); // Return error
							
						}else {
							
							req.flash('error', 'Something went wrong!! Please try again after sometimes.');

						}
					} else {
						
						req.flash('success','Your password has been changed successfully' );
					}
					
					res.redirect('back');
					
				});
			}else{
				
				req.flash('error', 'New and confirmation password have to be equal.');
				res.redirect('back');
				
			}
			
			
		}
	});	
});

module.exports = router;