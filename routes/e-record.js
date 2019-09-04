const express = require('express');
const router = express.Router(); // now instead of app, use router
const middleware = require('../middleware');
const hyperledger = require('../utils/hyperledger');
const https = require('https');

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
	})
	// const body = await response;
	// console.log(body);
	// res.render("app/e-record", {body: body});
});



module.exports = router;