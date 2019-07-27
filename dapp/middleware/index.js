
const multer = require('multer');
const User = require('../models/user');
const File = require('../models/file');

const middleware = {};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // the folder needs to be created beforehand which
        // is handled by routes/auth.js

        // TODO: fileName duplication, how to handle it
        cb(null, `encrypted/users/${req.user.username}`);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
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
            res.redirect('back')
        } else {

            // VERY IMPORTANT TO PREVENT CRASHES AS NOT EXISTING 
            // OBJECTID STILL GETS THE FUNCTION TO EXECUTE THIS PART
            // BY SIMPLY ADDING foundFile AS CONDITION
            if (foundFile && foundFile.owner.id.equals(req.user._id)) {
                next();
            } else {
                req.flash('error', `Permission denied for file ${req.params.id}!`);
                res.redirect('/private');
            }
        }
    });

}

middleware.checkIfAuthorized = function (req, res, next) {
    //retrieve the file

    //check if user is in the authorized array

    //if user is authorized : next

    //else flash message and redirect
}

module.exports = middleware;