const express = require('express');
const router = express.Router(); // now instead of app, use router
const File = require('../models/file');
const User = require('../models/user');
const middleware = require('../middleware');

const fs = require('fs');
const dir = 'encrypted/users';

router.get("/", middleware.isLoggedIn, function (req, res) {

    User.findById(req.user._id).populate('files').exec(function (err, data) {
        if (err) {
            console.log('FATAL ERROR: POPULATE FILES GONE WRONG');
            res.redirect('/');
        } else {

            // console.log(`Files retrieved from user ${req.user.username}`);
            // console.log(data);
            // console.log(`Length of files: ${data.files.length}`)
            res.render("private", { files: data.files });
        }
    });



});

// TODO: CREATE SHOULD UPLOAD REAL FILES ***************************************** !!!
// CREATE ROUTE
router.post("/", middleware.isLoggedIn, middleware.upload.single('upload'), (req, res, next) => {
    sanitize_text(req);
    // console.log('======================================');
    // console.log(req.file);
    // console.log('======================================');
    // console.log(req.body);
    // console.log('======================================');

    const file = req.file;

    if (!file) {
        const error = new Error('Please upload a file');
        error.httpStatusCode = 400;
        return next(error);
    } else {
        File.create(req.body.file, function (err, newFile) {
            if (err) {
                console.log(err);
                res.render("/private");
            } else {
                newFile.owner.id = req.user._id;
                newFile.owner.username = req.user.username;
                newFile.path = `${req.user.username}/${req.file.originalname}`;
                newFile.save();

                // console.log("New File created");
                // console.log(req.user);
                User.findById(req.user._id, function (err, user) {
                    if (err) {
                        console.log('FATAL ERROR: NEW FILE BUT NO USER!!!');
                        console.log(err);
                        res.redirect('/');
                    } else {
                        // console.log('User found');
                        user.files.push(newFile);
                        user.save();
                        // console.log(user);
                        res.redirect("/private");
                    }
                });
            }
        });
    }


});

// EDIT ROUTE SHOULD ALLOW UPLOAD FOR REAL FILES ********************************* !!!
// SHOW and EDIT ROUTE with button and modal form
router.get("/:id", middleware.isLoggedIn, function (req, res) {
    File.findById(req.params.id, function (err, foundFile) {
        if (err) {
            console.log(err);
            res.redirect("/private");
        } else {
            // TODO: Check that the file belongs to the current 
            res.render("private_show", { file: foundFile });
        }
    });
});

// UPDATE ROUTE SHOULD ALLOW UPLOAD FOR REAL FILES ******************************* !!!
// UPDATE ROUTE
router.put("/:id", middleware.isLoggedIn, function (req, res) {

    sanitize_text(req);

    File.findByIdAndUpdate(req.params.id, req.body.file, function (err, updatedFile) {
        if (err) {
            console.log("Updating caused an error", err);
            res.redirect("/private");
        } else {
            res.redirect(`/private/${req.params.id}`)
        }
    });
});

// TODO: UPDATE delete to modify user's files array
// DELETE ROUTE
router.delete("/:id", middleware.isLoggedIn, function (req, res) {
    // remove file from user's array named files
    User.updateOne({ _id: req.user._id },
        { $pullAll: { files: [req.params.id] } }, { safe: true }, function (err, obj) {
            if (err) {
                console.log(err);
            } else {
                console.log(obj);
            }
        });

    console.log(`Files id : ${req.params.id}`);
    User.findById(req.user._id, function (err, user) {
        console.log(user.files);
    })
    // remove file from collection files
    File.findByIdAndRemove(req.params.id, function (err, file) {
        if (err) {
            console.log("ERROR WHEN DELETING FILE ", err);
            res.redirect("/private");
        } else {
            if (fs.existsSync(`${dir}/${file.path}`)) {
                fs.unlink(`${dir}/${file.path}`, (err) => {
                    if (err) {
                        throw err;
                    }
                });
            }
            res.redirect("/private");
        }
    });
});

// TODO: req.body.file is empty, check for solutions
// as bodyParser cannot read from multipart/form-data
function sanitize_text(req) {
    req.body.file.accessible = req.body.file.accessible ? true : false;
    console.log(req.body.file.accessible);
    // sanitize file.fileName and file.note 
    req.body.file.fileName = req.sanitize(req.body.file.fileName);
    req.body.file.note = req.sanitize(req.body.file.note);
}

module.exports = router;