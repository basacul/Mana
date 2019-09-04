const express = require('express');
const router = express.Router(); // now instead of app, use router
const middleware = require('../middleware');
const hyperledger = require('../utils/hyperledger');


router.get("/", middleware.isLoggedIn, (req, res) => {
	const namespace = 'care.openhealth.mana.User';
	let body;
		
	hyperledger.getAll(namespace).then(data => {
		body = data;
		console.log(body);
	}).catch(error => {
		console.log(error);
	}).finally(() => {
		res.render("app/e-record", {body: body});
	});

});

// hyperledger.createUser(hyperledger.namespaces.user, mana._id.toString(), 'CLIENT' ).then(response => {
// body = response.data;
// console.log(body);
// res.render("app/e-record", {body: body});
// }).catch(error => {
// console.log(error);
// res.render("app/home");
// });
// // 	.finally(() => {
// // 	res.render("app/e-record", {body: body});
// // });

module.exports = router;