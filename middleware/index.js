const multer = require('multer');
const User = require('../models/user');
const File = require('../models/file');
const crypto = require('crypto');
const winston = require('../config/winston');

const middleware = {};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // thefolder temp needs to exist
        cb(null, 'temp')
    },
    filename: function (req, file, cb) {
		// a user can now have multiple duplicate files with same file name but stored with a different file path each
		const hash = crypto.createHmac('sha256', req.user.username).update(Date.now().toString()).digest('hex');
		const format = file.originalname.split('.').pop()
        cb(null, `${hash}.${format}`);
    }
});
const upload = multer({ storage: storage });

middleware.upload = upload;

/**
 * EXAMPLE WITH FILE FILTER THAT WON'T BE USED BUT IS 
 * MENTIONED FOR TEACHING PURPOSES
 * 
 * const imageFilter = (req, file, callback) => {
 *      if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
 *          return cb(new Error('Only image files are allowed!'), false);
 *      }
 *      cb(null, true);
 * }
 * 
 * .....
 * 
 * const upload = mutler({storage: storage, fileFilter: imageFilter});
 */

/**
 * middleware for authoritisation and authentication
 */
middleware.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error', 'Please, Login First');
        res.redirect('/');
    }
};



middleware.checkOwnership = function (req, res, next) {

    File.findById(req.params.id, function (error, foundFile) {
        if (error) {
			winston.error(error.message);
			req.flash('error', error.message);
            res.redirect('back');
        } else {

            // VERY IMPORTANT TO PREVENT CRASHES AS NOT EXISTING 
            // OBJECTID STILL GETS THE FUNCTION TO EXECUTE THIS PART
            // BY SIMPLY ADDING foundFile AS CONDITION
            if (foundFile && foundFile.owner.id.equals(req.user._id)) {
                next();
            } else {
				winston.info('User tried to access file to which it was not authorized.');
                req.flash('error', `Permission denied for file ${req.params.id}!`);
                res.redirect('/private');
            }
        }
    });

};

middleware.isVerified = function(req, res, next){
	User.findOne({username: req.body.username}, function(err,user){
		if(err){
			winston.error(err.message);
			req.flash('error', err.message);
			res.redirect('back');
		}else{
			if(user && !user.active){
				winston.inf('A log in attempt with a currently not verified account.');
				req.flash('error', 'Please verify your account before accessing Mana.');
				res.redirect('/verification');
			}else{
				next();	

			}
			
		}
	});
};

middleware.checkIfAuthorized = function (req, res, next) {
    //retrieve the file

    //check if user is in the authorized array

    //if user is authorized : next

    //else flash message and redirect
};

module.exports = middleware;