const express = require('express');
const mongoose = require('mongoose');
const router = express.Router(); // now instead of app, use router
const File = require('../models/file');
const User = require('../models/user');
const middleware = require('../middleware');

const fs = require('fs');
const dir = 'encrypted/users';

// TODO: Figure out, if I need to check if all these files are owned by the user
// as only the files in its db structure are retrieved, I dont think it is necessary
router.get("/", middleware.isLoggedIn, function (req, res) {

    User.findById(req.user._id).populate('files').exec(function (err, data) {
        if (err) {
            console.log('FATAL ERROR: POPULATE FILES GONE WRONG');
            res.redirect('/');
        } else {
            User.find({}, function (error, users) {
                if (error) {
                    console.log(error);
                    res.flash('error', error.message)
                    res.redirect('back');
                } else {
                    // TODO: the users array should only contain the usernames and further necessary identifiable infos
                    res.render("private", { files: data.files, users: users });
                }
            });
        }
    });



});

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
                res.render("private");
            } else {
                newFile.owner.id = req.user._id;
                newFile.owner.username = req.user.username;
                newFile.path = `${req.user.username}/${req.file.originalname}`;
                if (req.body.authorizedUser) {
                    newFile.authorized = req.body.authorizedUser.map(item => {
                        return mongoose.Types.ObjectId(item.split(':')[1].trim());
                    });
                }

                newFile.save();


                User.findById(req.user._id, function (err, user) {
                    if (err) {
                        console.log('FATAL ERROR: NEW FILE BUT NO USER!!!');
                        console.log(err);
                        req.flash('error', err.message);
                        res.redirect('/');
                    } else {
                        user.files.push(newFile);
                        user.save();
                        req.flash('success', 'New file uploaded');
                        res.redirect("/private");
                    }
                });
            }
        });
    }


});

// EDIT ROUTE SHOULD ALLOW UPLOAD FOR REAL FILES ********************************* !!!
// SHOW and EDIT ROUTE with button and modal form
router.get("/:id", middleware.isLoggedIn, middleware.checkOwnership, function (req, res) {
    File.findById(req.params.id, function (err, foundFile) {
        if (err) {
            console.log(err);
            res.redirect("/private");
        } else {
            User.find({}, function (error, users) {
                if (error) {
                    console.log(error);
                    res.redirect('back');
                } else {
                    res.render("private_show", { file: foundFile, users: users });
                }
            });

        }
    });
});

// UPDATE ROUTE SHOULD ALLOW UPLOAD FOR REAL FILES ******************************* !!!
// UPDATE ROUTE
router.put("/:id", middleware.isLoggedIn, middleware.checkOwnership, function (req, res) {

    sanitize_text(req);

    File.findByIdAndUpdate(req.params.id, req.body.file, function (err, updatedFile) {
        if (err) {
            console.log("Updating caused an error", err);
            res.redirect("/private");
        } else {

            if (!updatedFile) {
                return res.status(400).send("Item not found.")
            } else {
                // remove users from being authorized to access this file
                if (req.body.removeAuthorizedUser) {
                    const toRemove = req.body.removeAuthorizedUser.map(id => mongoose.Types.ObjectId(id));
                    for (let i = 0; i < toRemove.length; i++) {
                        console.log(`removing an authorized user ${toRemove[i]}`);
                        updatedFile.authorized.pull({ _id: toRemove[i] });
                    }

                } else {
                    console.log('No user to remove from authorized array.');
                }

                // add new users to be authorized to access this file
                if (req.body.authorizedUser) {

                    // retrieve ObjectId from the chosen user
                    const authorizedUsers = req.body.authorizedUser.map(item => {
                        return item.split(':')[1].trim();
                    });

                    console.log(`Value for authorized user is ${authorizedUsers}`)
                    authorizedUsers.forEach(toAdd => {
                        if (!updatedFile.authorized.includes(toAdd)) {
                            console.log('Authorized user not in the list');
                            updatedFile.authorized.push(toAdd);
                        }
                    });

                }


                updatedFile.save();
                req.flash('success', 'File successfully updated.');
                res.redirect(`/private/${req.params.id}`)
            }


        }
    });
});

// TODO: UPDATE delete to modify user's files array
// DELETE ROUTE
router.delete("/:id", middleware.isLoggedIn, middleware.checkOwnership, function (req, res) {
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

            req.flash('success', 'File successfully deleted.');
            res.redirect("/private");
        }
    });
});

// TODO: req.body.file is empty, check for solutions
// as bodyParser cannot read from multipart/form-data
function sanitize_text(req) {
    req.body.file.accessible = req.body.file.accessible ? true : false;
    console.log(`Sanitizing. file.accessible as boolean? : ${req.body.file.accessible}`);
    // sanitize file.fileName and file.note 
    req.body.file.fileName = req.sanitize(req.body.file.fileName);
    req.body.file.note = req.sanitize(req.body.file.note);
}

module.exports = router;