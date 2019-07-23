
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
 * middleware for authoritisation and authentication
 */
middleware.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/');
    }
};



middleware.checkOwnership = function (req, res, next) {

    File.findById(req.params.id, function (error, foundFile) {
        if (error) {
            res.redirect('back')
        } else {
            if (foundFile.owner.id.equals(req.user._id)) {
                next();
            } else {
                res.redirect('back');
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