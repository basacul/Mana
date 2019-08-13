const express = require('express');
const mongoose = require('mongoose');
const router = express.Router(); // now instead of app, use router
const File = require('../models/file');
const User = require('../models/user');
const crypt = require('crypto');
const middleware = require('../middleware');
const winston = require('../config/winston');
const fs = require('fs');
const dir = 'encrypted/users';

// TODO: Figure out, if I need to check if all these files are owned by the user
// as only the files in its db structure are retrieved, I dont think it is necessary
router.get("/", middleware.isLoggedIn, function (req, res) {

    User.findById(req.user._id).populate('files').exec(function (err, data) {
        if (err) {
			winston.error(err.message);
            res.redirect('/');
        } else {
            User.find({}, function (error, users) {
                if (error) {
					winston.error(error.message);
                    res.flash('error', error.message);
                    res.redirect('back');
                } else {
                    // TODO: the users array should only contain the usernames and further necessary identifiable infos
                    res.render("app/private", { files: data.files, users: onlyOtherUsers(users, req.user._id) });
                }
            });
        }
    });



});

// CREATE ROUTE
router.post("/", middleware.isLoggedIn, middleware.upload.single('upload'), (req, res, next) => {
    sanitize_text(req);


    const file = req.file;
    if (!(file &&req.body.file.fileName)) {
        const error = new Error('Provide file and file name.');
		// commented following two line to get rid of internal error
        //error.httpStatusCode = 400;
        //return next(error); 
		winston.error(error.message);
		req.flash('error', error.message);
		res.redirect('/private');
    } else {
        File.create(req.body.file, function (err, newFile) {
            if (err) {
                winston.error(err.message);
				req.flash(err.message);
                res.render("app/private");
            } else {
				// TODO: if empty file name then go back and update error message
				// TO
                newFile.owner.id = req.user._id;
                newFile.owner.username = req.user.username;
				// TODO: Give a unique file name to store in folder

			
                newFile.path = `${req.user.username}/${req.file.filename}`;
                if (req.body.authorizedUser) {
                    newFile.authorized = req.body.authorizedUser.map(item => {
                        return mongoose.Types.ObjectId(item.split(':')[1].trim());
                    });
                }

                newFile.save();
				winston.info('Ne file was uploaded by user to its respective folder.');

                User.findById(req.user._id, function (err, user) {
                    if (err) {
                        winston.error(err.message);
                        req.flash('error', err.message);
                        res.redirect('/');
                    } else {
						// in case no user with given id there is simply no error thus null testing
						if(user){
					  		user.files.push(newFile);
							user.save();
							winston.info('File ID pushed to corresponding user files array.');
							req.flash('success', 'New file uploaded');
						}else{
							winston.error('User account NOT found to push file id to files array.');
							req.flash('error', 'User not found to push file!');
						}
						res.redirect('/private');
                      
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
            winston.error(err.message);
			req.flash('error', err.message);
            res.redirect("/private");
		// if foundFile not null
        } else {
            User.find({}, function (error, users) {
                if (error) {
                    winston.error(error.message);
                    res.redirect('back');
                } else {
                    res.render("app/private_show", { file: foundFile, users: onlyOtherUsers(users, req.user._id) });
                }
            });

        }
    });
});

// DOWNLOAD FILE
router.post('/:id', middleware.isLoggedIn, middleware.checkOwnership, (req, res) => {
	
	File.findById(req.params.id, (error, file) => {
		// middleware.checkOwnership already checks for error and null
		const download = `encrypted/users/${file.path}`;
		res.download(download, err => {
			if(err){
				winston.error(err.message);
				req.flash('error', 'Download not possible.');
			}else{
				winston.info('File downlad was successful but not sure, if user finally wanted to download anyway.');
			}
		});
	})
	
});

// UPDATE ROUTE
router.put("/:id", middleware.isLoggedIn, middleware.checkOwnership, function (req, res) {

    sanitize_text(req);

    File.findByIdAndUpdate(req.params.id, req.body.file, function (err, updatedFile) {
        if (err) {
			winston.error(err.message);
			req.flash('error', err.message);
            res.redirect("/private");
        } else {

            if (!updatedFile) {
                return res.status(400).send("Item not found.");
            } else {
                // remove users from being authorized to access this file
                if (req.body.removeAuthorizedUser) {
                    const toRemove = req.body.removeAuthorizedUser.map(id => mongoose.Types.ObjectId(id));
                    for (let i = 0; i < toRemove.length; i++) {
                        updatedFile.authorized.pull({ _id: toRemove[i] });
                    }

                } 

                // add new users to be authorized to access this file
                if (req.body.authorizedUser) {

                    // retrieve ObjectId from the chosen user
                    const authorizedUsers = req.body.authorizedUser.map(item => {
                        return item.split(':')[1].trim();
                    });

                    authorizedUsers.forEach(toAdd => {
                        if (!updatedFile.authorized.includes(toAdd)) {                            
                            updatedFile.authorized.push(toAdd);
                        }
                    });

                }


                updatedFile.save();
				winston.info('A file was succesfully updated.');
                req.flash('success', 'File successfully updated.');
                res.redirect(`/private/${req.params.id}`);
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
                winston.error(err.message);
            } else {
                winston.info('A file id in an user s file array was removed.');
            }
        });

    // User.findById(req.user._id, function (err, user) {
    //     console.log(user.files);
    // });
    // remove file from collection files
    File.findByIdAndRemove(req.params.id, function (err, file) {
        if (err) {
            winston.error(err.message);
			req.flash('error', err.message);
            res.redirect("/private");
        } else {
            if (fs.existsSync(`${dir}/${file.path}`)) {
                fs.unlink(`${dir}/${file.path}`, (err) => {
                    if (err) {
						winston.error(err.message);
                        throw err;
                    }
                });
            }
			winston.info('File deleted from user s profile and folder.');
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


// removes the currently logged in user from the array users
function onlyOtherUsers(users, id){
	let list = [];
	if(users){
		users.forEach(user => {
		if(!user._id.equals(id)){
			list.push({username: user.username, _id: user._id});
		}
	});
	}
	return list;
}

module.exports = router;