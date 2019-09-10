const express = require('express');
const mongoose = require('mongoose');
const router = express.Router(); // now instead of app, use router
const File = require('../models/file');
const User = require('../models/user');
const Mana = require('../models/mana');
const crypt = require('crypto');
const middleware = require('../middleware');
const winston = require('../config/winston');
const aws = require('../utils/aws');
const fs = require('fs');
const hlf = require('../utils/hyperledger');

// TODO: Figure out, if I need to check if all these files are owned by the user
// as only the files in its db structure are retrieved, I dont think it is necessary
router.get("/", middleware.isLoggedIn, function (req, res) {

    User.findById(req.user._id).populate('files').exec(function (err, data) {
        if (err) {
			winston.error(err.message);
            res.redirect('/');
        } else {
			let users;
			hlf.getAll(hlf.namespaces.user).then(responseUsers => {
				users = responseUsers.data;
			}).catch(error => {
				winston.error(error.message);
				req.flash('error', 'Could not retrieve users on HLF.');
			}).finally(() => {
				Mana.findOne({user: req.user._id}, (error, mana) => {
					if (error) {
						winston.error(error.message);
						res.flash('error', error.message);
						res.redirect('back');
					} else {
						// TODO: the users array should only contain the usernames and further necessary identifiable infos
						res.render("app/private", { files: data.files, users: onlyOtherUsers(users, mana._id.toString()) });
					}
				});
			});
		}
	});
		
});

// CREATE ROUTE
router.post("/", middleware.isLoggedIn, middleware.upload.single('upload'), (req, res, next) => {
    sanitize_text(req);


    const file = req.file;
    if (!(file && req.body.file.filename)) {
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
                res.redirect("back");
            } else {
				
				newFile.owner.id = req.user._id;
				newFile.owner.username = req.user.username;
				newFile.path = `${req.user.username}/${req.file.filename}`;
				
				const uploadObject = aws.s3.putObject(aws.params(newFile.path)).promise();
				
				uploadObject.then(data => {
					
					winston.info('File upload to s3 successful.');
					
					newFile.ETag = data.ETag.toString();
					


					if (req.body.authorizedUser) {
						newFile.authorized = req.body.authorizedUser.map(item => {
							return mongoose.Types.ObjectId(item.split(':')[0].trim());
						});
					}
					
					
					
					User.findById(req.user._id, function (errUser, user) {
						if (errUser) {
							winston.error(err.message);
							req.flash('error', err.message);
							res.redirect('/');
						} else {
							// in case no user with given id there is simply no error thus null testing
							if(user){
								newFile.save();
								user.files.push(newFile);
								user.save();
								winston.info('File Upload successfully completed.');
								req.flash('success', 'New file uploaded');
								
							}else{
								winston.error('User account NOT found to push file id to files array.');
								req.flash('error', 'User not found to push file!');
							}
							
							winston.info('New file was uploaded by user to its respective folder.');
							res.redirect('/private');

						}
					});
				}).catch(error => {
					winston.error(error.message);
					req.flash('error', 'File could not be uploaded on amazon aws S3');
					res.redirect('back');
				}).finally(function() {
					fs.unlink(`temp/${file.filename}`, (err) => {
						if (err) {
							winston.error(err.message);
						}else{
							winston.info('File successfully removed from webserver');
						}
					});
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
			let users;
			hlf.getAll(hlf.namespaces.user).then(responseUsers => {
				users = responseUsers.data;
			}).catch(error => {
				winston.error(error.message);
				req.flash('error', 'Could not retrieve users on HLF.');
			}).finally(() => {
				Mana.findOne({user: req.user._id}, (error, mana) => {
					if (error) {
						winston.error(error.message);
						res.flash('error', error.message);
						res.redirect('back');
					} else {
						// TODO: the users array should only contain the usernames and further necessary identifiable infos
						res.render("app/private_show", { file: foundFile, users: onlyOtherUsers(users, mana._id.toString()) });
					}
				});
			});
            // User.find({}, function (error, users) {
            //     if (error) {
            //         winston.error(error.message);
            //         res.redirect('back');
            //     } else {
            //         res.render("app/private_show", { file: foundFile, users: onlyOtherUsers(users, req.user._id) });
            //     }
            // });

        }
    });
});

// DOWNLOAD FILE
router.post('/:id', middleware.isLoggedIn, middleware.checkOwnership, (req, res) => {
	
	File.findById(req.params.id, (error, file) => {
		// middleware.checkOwnership already checks for error and null
		
		// =============================================================================
		// DOWNLOAD FROM AMAZON AWS S3
		// =============================================================================
		const downloadObject = aws.s3.getObject(aws.paramsDownload(file.path)).createReadStream(); 
		
		const filename = file.path.split('/')[1];

		// in order to download the file. otherwise file is displayed in the browser
		// TODO: Check if pdf, jpeg or any form that can be displayed and downloaded form browser
		// 		 otherwise direct download by adding res.attachement(filename)
		res.attachment(filename);
		downloadObject.on('error', err => {
			winston.error(err.message);
			req.flash('error', 'File could not be downloaded from amazon aws S3');
			res.redirect('back');
		}).pipe(res);
	});
	
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
                        return item.split(':')[0].trim();
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

// TODO: Delete AWS FILE
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

			const deleteObject = aws.s3.deleteObject(aws.paramsRemove(file.path)).promise();
				
			deleteObject.then( data => {
			  
				winston.info('File was successfully deleted from s3');
				
				
					
					
				req.flash('success', 'File successfully deleted from s3.');
				res.redirect("/private");
			}).catch( error => {
				winston.error(`File with key ${file.path} could not be deleted from s3`);
				req.flash('error', 'File still available on s3.');
				res.redirect("/private");
			});
			
           
            
        }
    });
});

// TODO: req.body.file is empty, check for solutions
// as bodyParser cannot read from multipart/form-data
function sanitize_text(req) {
    req.body.file.accessible = req.body.file.accessible ? true : false;
    console.log(`Sanitizing. file.accessible as boolean? : ${req.body.file.accessible}`);
    // sanitize file.filename and file.note 
    req.body.file.filename = req.sanitize(req.body.file.filename);
    req.body.file.note = req.sanitize(req.body.file.note);
}


// removes the currently logged in user from the array users
function onlyOtherUsers(hlfUsers, id){
	let list = [];
	if(hlfUsers){
		hlfUsers.forEach(user => {
		if(user.manaId != id){
			list.push({manaId: user.manaId, role: user.role});
		}
	});
	}
	return list;
}

module.exports = router;