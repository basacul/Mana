const express = require('express');
const mongoose = require('mongoose');
const router = express.Router(); // now instead of app, use router
const middleware = require('../middleware');
const hlf = require('../utils/hyperledger');
const Mana = require('../models/mana');
const File = require('../models/file');
const User = require('../models/user');
const winston = require('../config/winston');
const download = require('../config/download');
/**
* E-Record Home 
*/
router.get('/', middleware.isLoggedIn, (req, res) => {

	let users;
	
	hlf.getAll(hlf.namespaces.user).then(response => {
		users = response.data;
	}).catch(error => {
		console.log(error);
	}).finally(() => {
		res.render("app/e-record/e-record", {users: users});
	})	
	
});

/**
* Association Home
*/
router.get('/association', middleware.isLoggedIn, (req, res) => {
	let associations;
	let users;
	let items;
	let manaId;
	
	Mana.findOne({user: req.user._id}, (error, mana) => {
		if(error){
			winston.error(error.message);
			req.flash('error', error.message);
			res.redirect('back');
		}else{
			hlf.getAll(hlf.namespaces.association).then(responseAssociation => {
				associations = responseAssociation.data;
				return hlf.getAll(hlf.namespaces.user);
			}).then(responseUsers => {
				users = responseUsers.data;
				// TODO: filter out the current user
				users = users.filter(user => user.manaId != `${mana._id}`);
				return hlf.getAll(hlf.namespaces.item);
			}).then(responseItems => {
				items = responseItems.data;
				// TODO: provide query in hlf to get rid of filtering
				if(items){
					items = items.filter(item => {
						return (item.owner == `resource:${hlf.namespaces.user}#${mana._id}`);
					});
				}
			}).catch(error => {
				console.log(error);
				res.redirect('back');
			}).finally(() => {
				res.render("app/e-record/association", {associations: associations, items: items, users: users, manaId: mana._id.toString()});
			});
		}
	});
	
});

/**
* Create new Association through transaction
*/
router.post('/association', middleware.isLoggedIn,(req, res) => {

		if(!req.body.association.from){
			winston.error("No manaId given for posting a new association");
			req.flash('error', "ManaId is missing on association.ejs");
			res.redirect('back');
		}else{
			hlf.createAssociation(req.body.association).then(responseAssociation => {
				req.flash('success', 'Association created on HLF');
				console.log(responseAssociation.data);
			}).catch(error => {
				winston.error(error.message);
				req.flash('error', 'Association not on HLF');
			}).finally(() => {
				res.redirect('back')
			});
		}
});

/**
* Association Detail Page
*/
router.get('/association/:associationId', middleware.isLoggedIn, (req, res) => {
	let association;
	let users;
	let items;
	let manaId;
	let files;
	
	Mana.findOne({user: req.user._id}, (error, mana) => {
		if(error){
			winston.error(error.message);
			req.flash('error', error.message);
			res.redirect('back');
		}else{
			User.findById(req.user._id).populate('files').exec(function (err, data) {
				if (err) {
					winston.error(err.message);
					res.redirect('back');
				} else {
					hlf.getAssociationById(req.params.associationId).then(responseAssociation => {
						association = responseAssociation.data;
						return hlf.getAll(hlf.namespaces.user);
					}).then(responseUsers => {
						users = responseUsers.data;
						// TODO: filter out the current user
						users = users.filter(user => user.manaId != `${mana._id}`);
						return hlf.getAll(hlf.namespaces.item);
					}).then(responseItems => {
						items = responseItems.data;
						// TODO: provide query in hlf to get rid of filtering
						if(items){
							items = items.filter(item => {
								return (item.owner == `resource:${hlf.namespaces.user}#${mana._id}`);
							});
						}

					}).catch(error => {
						winston.error(error.message);
					}).finally(() => {
						res.render("app/e-record/association_show", {association: association[0], items: items, users: users, manaId: mana._id.toString(), files: data.files});
					});
				}
			});
			
		}
	})
});

/**
* Send message for respective Association
*/
router.put('/association/:associationId', middleware.isLoggedIn, (req,res) => {
	hlf.sendMessageAssociation(req.params.associationId, req.body.message).then(responeAssociation => {
		winston.info('Message sent for respective Association');
		req.flash('success', 'Message successfully sent');
	}).catch(error => {
		winston.error(error.message);
		req.flash('error', 'Message NOT sent!');
	}).finally(()=>{
		res.redirect('back');
	})
});

/**
* Download file for approved association only
*/
router.post('/association/:associationId/download', middleware.isLoggedIn, (req, res) => {

});	

/**
* Grant association
*/
router.put('/association/:associationId/grant', middleware.isLoggedIn, (req, res) => {
	// 1. Retrieve file
	const fileId = mongoose.Types.ObjectId(req.body.association.fileId);
	File.findById(fileId, (error, file) => {
		if(error){
			winston.error(error.message);
			req.flash('error', 'File not found to update');
			res.redirect('back');
		}else{
			// 2. Update authorized with new manaId in 
			console.log(req.body.association);
			file.authorized.push(mongoose.Types.ObjectId(req.body.association.from));
			file.accessible = true;
			file.save();
			
			const link = `${download.url}/${file._id}`;
			
			// grant association on hlf
			hlf.grantAssociation(req.params.associationId, req.body.association.message, link).then(responseGrant => {
				console.log(responseGrant.data);
			}).catch(error => {
				console.log(error);
			}).finally(() => {
				res.redirect('back')
			});
		}
	});
});

/**
* Download file for approved association only
*/
router.put('/association/:associationId/revoke', middleware.isLoggedIn, (req, res) => {
	// 1. Retrieve file
	const fileId = mongoose.Types.ObjectId(req.body.association.fileId);
	File.findById(fileId, (error, file) => {
		if(error){
			winston.error(error.message);
			req.flash('error', 'File not found to update');
			res.redirect('back');
		}else{
			file.authorized.pull(mongoose.Types.ObjectId(req.body.association.fileId));
			file.save();
			
			hlf.revokeAssociation(req.params.associationId, req.body.association.message).then(responseRevoke => {
				console.log(responseRevoke.data);
				winston.info('Association access revoked.');
				req.flash('success', 'Successfully updated hlf.');
			}).catch(error => {
				winston.error(error.message);
				req.flash('error', 'Could not perform revoke on hlf');
			}).finally(() => {
				res.redirect('back');
			})
		}
	});
});	

/**
* Item Home Page
*/
router.get('/item', middleware.isLoggedIn, (req, res) => {
	let items;
	let users;
	
	hlf.getAll(hlf.namespaces.item).then(itemData => {
		items = itemData;
		return hlf.getAll(hlf.namespaces.user);
	}).then(userData => {
		users = userData;
	}).catch(error => {
		console.log(error);
	}).finally(() => {
		res.render("app/e-record/item", {items: items, users: users});
	});
})





module.exports = router;