
const multer = require('multer');
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
const middleware = {};

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

middleware.upload = upload;


module.exports = middleware;