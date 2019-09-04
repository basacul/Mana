const config = require('../config/hyperledger');
const https = require('https');
const axios = require('axios');
/**
* in order to turn off rejections due to self signed certificates
* such as the hyperledger server 
*/
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


const roles = {
    CLIENT: 'CLIENT',
    PROVIDER: 'PROVIDER',
    INSURANCE: 'INSURANCE'
};



let hyperledger = {};

hyperledger.namespaces = {
	user: `${config.namespace}.User`,
	item:  `${config.namespace}.Item`,
	association:  `${config.namespace}.Association`,
}

hyperledger.createUser = function(namespace, manaId, role){
	return axios.post(`${config.url}/${namespace}`, {
		$class: hyperledger.namespaces.user,
		manaId: manaId,
		role: role
	});
};

// hyperledger.createUser = function(namespace, manaId,role){
// 	const postData = JSON.stringify({
// 	  $class: hyperledger.namespaces.user,
// 	  manaId: manaId,
// 	  role: role
// 	});
	
// 	const options = {
// 		hostname: `${config.hostname}`,
// 		port: config.port,
// 		path: `api/${namespace}`,
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json; charset=utf-8',
// 			'Content-Length': Buffer.byteLength(postData),
// 			'Accept': 'application/json',
// 			'conncetion': 'Close'
// 			}
// 	};
	
	
// 	return new Promise((resolve, reject) => {
// 		const request = https.request(options, (response) => {
// 			// if(response.statusCode < 200 || response.statusCode > 299){
// 			// 	reject(new Error('Failed to load page, status code: ' + response.statusCode));
// 			// }
// 			// for the body I need to set the respective encoding 
// 			response.setEncoding('utf8');
// 			response.on('data', (body) => {
// 				resolve(JSON.parse(body));
// 			});
// 		});
		
// 		request.on('error', (err) => reject(err));
		
// 		// write data to request body
// 		request.write(postData);
// 	});
// }

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
			});
		});
		request.on('error', (err) => reject(err));
	});
	
}



module.exports = hyperledger;