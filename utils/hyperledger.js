const config = require('../config/hyperledger');
const https = require('https');

// in order to turn off rejections due to self signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let hyperledger = {};

hyperledger.getAll = function(namespace){
	return new Promise((resolve, reject) => {
		const request = https.get(`${config.url}/${namespace}`, (response) => {
			if(response.statusCode < 200 || response.statusCode > 299){
				reject(new Error('Failed to load page, status code: ' + response.statusCode));
			}
			// for the body I need to set the respective encoding 
			response.setEncoding('utf8');
			response.on('data', (body) => {
				resolve(JSON.parse(body));
			})
		});
		
		request.on('error', (err) => reject(err));
	});
	
}


// console.log("utils/hyperledger.js outside Promise");
// 	return new Promise((resolve, reject) => {
// 		console.log("utils/hyperledger.js inside Promise");
// 		https.get(`${config.url}/${namespace}`, (response) => {
// 			console.log("utils/hyperledger.js inside https.get in Promise");
// 			console.log(response);
// 			// for the body I need to set the respective encoding 
// 			response.setEncoding('utf8')
// 			response.on('body', (body) => {
// 				console.log("utils/hyperledger.js inside response.on Promise");
// 				console.log(body);
// 				resolve(JSON.parse(body));
// 			});
// 		}).on('error', reject);
// 	});
module.exports = hyperledger;