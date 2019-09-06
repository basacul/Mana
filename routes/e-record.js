const express = require('express');
const router = express.Router(); // now instead of app, use router
const middleware = require('../middleware');
const hlf = require('../utils/hyperledger');
const Mana = require('../models/mana');
const winston = require('../config/winston');

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
		console.log(req.body.association.from);
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
	
	Mana.findOne({user: req.user._id}, (error, mana) => {
		if(error){
			winston.error(error.message);
			req.flash('error', error.message);
			res.redirect('back');
		}else{
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
				console.log(error);
			}).finally(() => {
				console.log(association);
				console.log(association.messages);
				res.render("app/e-record/association_show", {association: association[0], items: items, users: users, manaId: mana._id.toString()});
			});
		}
	})
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