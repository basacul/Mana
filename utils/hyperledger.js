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

//=====================================================================================
// USER RELATED
//=====================================================================================
hyperledger.createUser = function(manaId, role){
	return axios.post(`${config.url}/${hyperledger.namespaces.user}`, {
		$class: hyperledger.namespaces.user,
		manaId: manaId,
		role: role
	});
};


//=====================================================================================
// ASSOCIATION RELATED
//=====================================================================================
/**
* Create new association by performing transaction
* @params association is a Json object that holds the key value pairs 
* 		  for the post request
*/
hyperledger.createAssociation = function(association){
	let associationObject = {};
	
	// initialize values for the post request of a new association
	associationObject.$class = hyperledger.namespaces.Association;
	associationObject.to = `${hyperledger.namespaces.user}#${association.to}`;
	associationObject.message = association.message;
	if(association.item){
		associationObject.item = `${hyperledger.namespaces.item}#${association.item}`;
	}
	associationObject.associationId = crypto.createHmac('sha256', association.from).update(Date.now().toString()).digest('hex');
	associationObject.from = `${hyperledger.namespaces.user}#${association.from}`;
	
	
	return axios.post(`${config.url}/${config.namespace}.CreateAssociation`, associationObject);
}


/**
* Using the query interface 
*/
hyperledger.getAssociationById = function(id){
	return axios.get(`${config.url}/queries/selectAssociationById?id=${id}`)
}

/**
* Grant association by invoking GrantAssociation transaction
*/
hyperledger.grantAssociation = function(associationId, message, link){
	let associationObject = {};
	associationObject.$class = `${config.namespace}.GrantAssociation`;
	associationObject.association = `resource:${hyperledger.namespaces.association}#${associationId}`;
	associationObject.message = message;
	
	// generate link for given file: https://mana.openhealth.care/files/fileID
	// for testing https://
	associationObject.link = link;

	return axios.post(`${config.url}/${config.namespace}.GrantAssociation`, associationObject);
};

/**
* Revoke association by invoking RevokeAssociation transaction
*/
hyperledger.revokeAssociation = function(associationId, message){
	let associationObject = {};
	associationObject.$class = `${config.namespace}.RevokeAssociation`;
	associationObject.association = `resource:${hyperledger.namespaces.association}#${associationId}`;
	associationObject.message = message;
	
	return axios.post(`${config.url}/${config.namespace}.RevokeAssociation`, associationObject);
};

/**
* Send message for respective Association through UpdateAssociation transaction
* optional parameters such as item and link are excluded
*/
hyperledger.sendMessageAssociation = function(associationId, message){
	let associationObject = {};
	associationObject.$class = `${config.namespace}.UpdateAssociation`;
	associationObject.association = `resource:${hyperledger.namespaces.association}#${associationId}`;
	associationObject.message = message;
	
	return axios.post(`${config.url}/${config.namespace}.UpdateAssociation`, associationObject);
}

//=====================================================================================
// ITEM RELATED
//=====================================================================================


//=====================================================================================
// GENERAL FUNCTIONS FOR ALL NAMESPACES
//=====================================================================================
/**
* Return all items from respective namespace such as User, Association and Item
*/
hyperledger.getAll = function(namespace){
	return axios.get(`${config.url}/${namespace}`);	
}

/**
* Using the REST interface for the respective namespace 
*/
hyperledger.getById = function(namespace, id){
	return axios.get(`${config.url}/${namespace}/${id}`);
}

hyperledger.deleteById = function(namespace, id){
	return axios.delete(`${config.url}/${namespace}/${id}`);
}

module.exports = hyperledger;