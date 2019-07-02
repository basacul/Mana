const express = require('express');
const router = express.Router(); // now instead of app, use router
const File = require('../models/file');

router.get("/", isLoggedIn, function (req, res) {
    File.find({}, function (error, files) {
        if (error) {
            console.log(error);
        } else {
            res.render("private", { files: files });
        }
    });

});

// TODO: CREATE SHOULD UPLOAD REAL FILES ***************************************** !!!
// CREATE ROUTE
router.post("/", isLoggedIn, function (req, res) {
    sanitize_text(req);
    File.create(req.body.file, function (err, newFile) {
        if (err) {
            console.log(err);
            res.render("/private");
        } else {
            console.log("New File created");
            res.redirect("/private");
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

// DELETE ROUTE
router.delete("/:id", isLoggedIn, function (req, res) {
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
    req.body.file.shared = req.body.file.shared ? true : false;

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