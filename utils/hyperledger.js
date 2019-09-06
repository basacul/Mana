const config = require('../config/hyperledger');
const axios = require('axios');
const crypto = require('crypto');
const Mana = require('../models/mana');
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

hyperledger.createUser = function(manaId, role){
	return axios.post(`${config.url}/${hyperledger.namespaces.user}`, {
		$class: hyperledger.namespaces.user,
		manaId: manaId,
		role: role
	});
};

/**
* Create new association
* @params association is a Json object that holds the key value pairs 
* 		  for the post request
*/
hyperledger.createAssociation = function(association, manaId){
	let associationObject = {};
	associationObject.$class = hyperledger.namespaces.Association;
	associationObject.to = `${hyperledger.namespaces.user}#${association.to}`;
	associationObject.message = association.message;
	if(association.item){
		associationObject.item = `${hyperledger.namespaces.item}#${association.item}`;
	}
	associationObject.associationId = crypto.createHmac('sha256', manaId.toString()).update(Date.now().toString()).digest('hex');
	associationObject.from = `${hyperledger.namespaces.user}#${manaId.toString()}`;
	
	return axios.post(`${config.url}/${config.namespace}.CreateAssociation`, associationObject);
	
}
/**
* Somehow not a function
*/
hyperledger.getAll = function(namespace){
	return axios.get(`${config.url}/${namespace}`);	
}

hyperledger.getById = function(namespace, id){
	return axios.get(`${config.url}/${namespace}/id`)
}

hyperledger.deleteById = function(namespace, id){
	return axios.delete(`${config.url}/${namespace}/${id}`);
}



module.exports = hyperledger;