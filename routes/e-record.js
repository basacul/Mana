const express = require('express');
const router = express.Router(); // now instead of app, use router
const middleware = require('../middleware');
const hlf = require('../utils/hyperledger');
const Mana = require('../models/mana');


router.get('/', middleware.isLoggedIn, (req, res) => {

	let users;
	
	hlf.getAll(hlf.namespaces.user).then(response => {
		users = response.data;
	}).catch(error => {
		console.log(error);
	}).finally(() => {
		res.render("app/e-record", {users: users});
	})	
	
});

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
			}).finally(() => {
				res.render("app/association", {associations: associations, items: items, users: users});
			});
		}
	})
	
});

router.post('/association', middleware.isLoggedIn,(req, res) => {
	Mana.findOne({user: req.user._id}, (error, mana) => {
		if(error){
			winston.error(error.message);
			req.flash('error', error.message);
			res.redirect('back');
		}else{
			hlf.createAssociation(req.body.association, mana._id).then(responseAssociation => {
				req.flash('success', 'Association created on HLF');
				console.log(responseAssociation.data);
			}).catch(error => {
				winston.error(error.message);
				req.flash('error', 'Association not on HLF');
			}).finally(() => {
				res.redirect('back')
			});
		}
	})

});

router.get('/association/:associationId', middleware.isLoggedIn, middleware.isLoggedIn, (req, res) => {
	res.send('TODO: Interface for ');
});

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
		res.render("app/item", {items: items, users: users});
	});
})





module.exports = router;