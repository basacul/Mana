const multer = require('multer');
const mongoose = require('mongoose');
const User = require('../models/user');
const File = require('../models/file');
const Mana = require('../models/mana');
const crypto = require('crypto');
const winston = require('../config/winston');
const hlf = require('../utils/hyperledger');

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

middleware.checkIfAuthorizedAssociation = function (req, res, next) {
	let association;
	
    //retrieve respective association from HLF
	hlf.getAssociationById(req.params.associationId).then(responseAssociation => {
		
		association = responseAssociation.data[0];
		
		// create file Id in order to retrieve the respective file object
		const fileId = mongoose.Types.ObjectId(association.link.split('files/')[1]);
		
		
		// retrieve ManaId of logged in user
		Mana.findOne({user: req.user._id}, (errorMana, mana) => {
			
			if(errorMana){
				
				winston.error(errorMana.message);
				req.flash('error', 'Could not find Mana');
				res.redirect('back');
				
			}else{
				
				File.findById(fileId, (errorFile, file) => {
			
					if(errorFile){
						
						winston.error(errorFile.message);
						req.flash('error', 'File not found');
						res.redirect('back');

					// check if current user's manaID equals the requester's manaId in association	
					}else if(mana._id.toString() != association.from.split('#')[1]){
						console.log(`Current mana._id: ${mana._id}`);
						console.log(`Association from manaID: ${association.from.split('#')[1]}`);
						console.log(`Association to manaID: ${association.to.split('#')[1]}`);
						winston.error('Current user s manaId and authorized manaId do not match');
						req.flash('error','Mana ID mismatch.');
						res.redirect('back');
						
					//check if user by manaId is in the authorized array
					}else if(!file.authorized.includes(mana._id)){
						
						//else flash message and redirect
						winston.error('User is not authorized to access file.');
						req.flash('error', 'You are not authorized.');
						res.redirect('back');
						
					}else{
						
						// otherwise user is authorized : next
						// pass file path to call aws method. Done via request body
						req.filePath = file.path;
						next();
						
					}
				});
			}
		});
	}).catch(error => {
		
		winston.error(error.message);
		req.flash('No HLF Connection.')
		res.redirect('back');
		
	});  
};

middleware.checkIfAuthorizedItem = function(req, res, next){
	let item;
	
	hlf.selectItemById(req.params.itemId).then(responseItem => {
		item = responseItem.data[0];
		
		// create file Id in order to retrieve the respective file object
		const fileId = mongoose.Types.ObjectId(item.link.split('files/')[1]);
		
		Mana.findOne({user: req.user._id}, (errorMana, mana) => {
			if(errorMana){
				
				winston.error(errorMana.message);
				req.flash('error', 'Could not find Mana');
				res.redirect('back');
				
			}else{
				
				hlf.getById(hlf.namespaces.user, mana._id.toString()).then(responseUser => {
					const user = responseUser.data;
					if(user.role === item.role){
						File.findById(fileId, (errorFile, file) =>{
							if(errorFile){
								winston.error(errorFile.message);
								req.flash('error', 'File not found');
								res.redirect('back');
							}else if(!file.accessible){
								winston.error('The file associated to the item is not accessible.');
								req.flash('error', 'File is not accessible.');
								res.redirect('back');
							}else{
								// otherwise user is authorized : next
								// pass file path to call aws method. Done via request body
								req.filePath = file.path;
								next();
							}
						});
					}else{
						winston.error('User is not authorized to access file.');
						req.flash('error', 'You are not authorized.');
						res.redirect('back');
					}
				})
			}
		});
	});
}

module.exports = middleware;