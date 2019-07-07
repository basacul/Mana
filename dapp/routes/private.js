const express = require('express');
const router = express.Router(); // now instead of app, use router
const multer = require('multer');
const File = require('../models/file');
const User = require('../models/user');

router.get("/", isLoggedIn, function (req, res) {

    User.findById(req.user._id).populate('files').exec(function (err, data) {
        if (err) {
            console.log('FATAL ERROR: POPULATE FILES GONE WRONG');
            res.redirect('/');
        } else {

            console.log(`Files retrieved from user ${req.user.username}`);
            console.log(data);
            console.log(`Length of files: ${data.files.length}`)
            res.render("private", { files: data.files });
        }
    });



});

// TODO: CREATE SHOULD UPLOAD REAL FILES ***************************************** !!!
// CREATE ROUTE
router.post("/", isLoggedIn, function (req, res) {
    sanitize_text(req);
    console.log('Retrieved file');
    console.log(req.body.file);
    File.create(req.body.file, function (err, newFile) {
        if (err) {
            console.log(err);
            res.render("/private");
        } else {

            console.log("New File created");
            console.log(req.user);
            User.findById(req.user._id, function (err, user) {
                if (err) {
                    console.log('FATAL ERROR: NEW FILE BUT NO USER!!!');
                    console.log(err);
                    res.redirect('/');
                } else {
                    console.log('User found');
                    user.files.push(newFile);
                    user.save();
                    console.log(user);
                    res.redirect("/private");
                }
            });
        }
    });
});

// EDIT ROUTE SHOULD ALLOW UPLOAD FOR REAL FILES ********************************* !!!
// SHOW and EDIT ROUTE with button and modal form
router.get("/:id", isLoggedIn, function (req, res) {
    File.findById(req.params.id, function (err, foundFile) {
        if (err) {
            console.log(err);
            res.redirect("/private");
        } else {
            res.render("private_show", { file: foundFile });
        }
    });
});

// UPDATE ROUTE SHOULD ALLOW UPLOAD FOR REAL FILES ******************************* !!!
// UPDATE ROUTE
router.put("/:id", isLoggedIn, function (req, res) {

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
router.delete("/:id", isLoggedIn, function (req, res) {
    // remove file from user's array named files
    User.updateOne({ _id: req.user._id }, { $pullAll: { files: [req.params.id] } }, { safe: true }, function (err, obj) {
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
    File.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            console.log("ERROR WHEN DELETING FILE ", err);
            res.redirect("/private");
        } else {
            res.redirect("/private");
        }
    });
});

function sanitize_text(req) {
    console.log('PRINTING BODY OF REQ');
    console.log(req.body);
    if (req.body.file.shared) {
        req.body.file.shared = true;
    } else {
        req.body.file.shared = false;
    }


    // sanitize file.fileName and file.note 
    req.body.file.fileName = req.sanitize(req.body.file.fileName);
    req.body.file.note = req.sanitize(req.body.file.note);
}


/**
 * Our middleware for authoritisation and authentication
 */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/');
    }
}

module.exports = router;