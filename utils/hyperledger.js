const config = require('../config/hyperledger');
const axios = require('axios');
const crypto = require('crypto');
const Mana = require('../models/mana');
const File = require('../models/file');
const mongoose = require('mongoose');

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
* @return A Promise that returns the response. The required data is in response.data as JSON object
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
* Get all associations where the user is in to or from. Performs a query
*/
hyperledger.selectConcernedAssociation = function(manaId){
	console.log('==========================================')
	console.log('selectConcernedAssociation');
	console.log(`Mana ID: ${manaId}`);
	console.log('==========================================')
	return axios.get(`${config.url}/queries/selectConcernedAssociation?user=resource%3A${hyperledger.namespaces.user}%23${manaId}`);
};

/**
* Using the query interface 
*/
hyperledger.getAssociationById = function(id){
	return axios.get(`${config.url}/queries/selectAssociationById?id=${id}`)
};

/**
* Grant association by invoking GrantAssociation transaction
*/
hyperledger.grantAssociation = function(associationId, message, manaId, link){
	let associationObject = {};
	associationObject.$class = `${config.namespace}.GrantAssociation`;
	associationObject.association = `resource:${hyperledger.namespaces.association}#${associationId}`;
	associationObject.from = manaId;
	associationObject.message = message;
	
	// generate link for given file: https://mana.openhealth.care/files/fileID
	// for testing https://
	associationObject.link = link;

	return axios.post(`${config.url}/${config.namespace}.GrantAssociation`, associationObject);
};

/**
* Revoke association by invoking RevokeAssociation transaction
*/
hyperledger.revokeAssociation = function(associationId, message, manaId){
	let associationObject = {};
	associationObject.$class = `${config.namespace}.RevokeAssociation`;
	associationObject.association = `resource:${hyperledger.namespaces.association}#${associationId}`;
	associationObject.from = manaId;
	associationObject.message = message;
	
	return axios.post(`${config.url}/${config.namespace}.RevokeAssociation`, associationObject);
};

/**
* Send message for respective Association through UpdateAssociation transaction
* optional parameters such as item and link are excluded
*/
hyperledger.sendMessageAssociation = function(associationId, message, manaId){
	let associationObject = {};
	associationObject.$class = `${config.namespace}.UpdateAssociation`;
	associationObject.association = `resource:${hyperledger.namespaces.association}#${associationId}`;
	associationObject.from = manaId;
	associationObject.message = message;
	
	return axios.post(`${config.url}/${config.namespace}.UpdateAssociation`, associationObject);
}

/**
* Delete association with given association Id
* @param associationId A string representing the association ID in hlf
* @param userId An ObjectId of the schema User
*/
hyperledger.deleteAssociation = function(associationId, userId){
	Mana.findOne({user: userId}, (error, mana) => {
		if(error){
			winston.error(error.message);
			req.flash('error', 'Cannot delete association now.');
		}else{
			hyperledger.getAssociationById(associationId).then(responseAssociation => {
				const associationHLF = responseAssociation.data[0];
				if(associationHLF.from == `resource:${hyperledger.namespaces.user}#${mana._id.toString()}`){
					let associationObject = {};
					associationObject.$class = `${config.namespace}.DeleteAssociation`;
					associationObject.association = `${hyperledger.namespaces.association}#${associationId}`;
					
					// pull user with mana._id from authorized array
					console.log("============================================================");
					console.log("delete Association with the following values");
					console.log(associationHLF);
					console.log(`Link: ${associationHLF.link.split('files/')[1]}`);
					console.log("============================================================");
					if(associationHLF.link){
						
						// THIS IS NOT THE APPROPRIATE SOLUTION. RESPECTIVE USER SHOULD CHECK ITSELF IF STILL SHARED
						const fileId = mongoose.Types.ObjectId(associationHLF.link.split('files/')[1]);
						
						File.findOne(fileId, (errorFile, file) => {
							if(errorFile){
								winston.error(errorFile.message);
								req.flash('error', 'Could not update respective file');
							}else{
								console.log(file);
								file.authorized.pull({ _id: mana._id });
								file.save();
							}
						});
					}
					
				
					
					axios.post(`${config.url}/${config.namespace}.DeleteAssociation`, associationObject);
					
				}else{
					req.flash('error', 'Denied.');
				}
			});
		}
	})
}

//====================================================================================
// ITEM RELATED
//=====================================================================================
/**
* Using the query interface 
*/
hyperledger.selectItemByRole = function(role){
	console.log('==========================================')
	console.log('selectItemByRole');
	console.log(`Role: ${role}`);
	console.log('==========================================')
	return axios.get(`${config.url}/queries/selectItemByRole?role=${role}`)
};

/**
* Get all items that belong to the logged in user
*/
hyperledger.selectOwnedItem = function(manaId){
	return axios.get(`${config.url}/queries/selectOwnedItem?user=resource%3A${hyperledger.namespaces.user}%23${manaId}`)
};

/**
* Gets the item
* @param itemId: The ID of the item 
*/
hyperledger.selectItemById = function(itemId){
	return axios.get(`${config.url}/queries/selectItemById?id=${itemId}`);
};

/**
* Create new item
* @param item json object with values for owner, role, description and link
*/
hyperledger.createItem = function(item){
	item.itemId = crypto.createHmac('sha256', item.link).update(Date.now().toString()).digest('hex');
	return axios.post(`${config.url}/${config.namespace}.CreateItem`, item);
};

/**
* Update item on HLF
* @param item: Json object with itemId, $class, role, description, link, owner
*/
hyperledger.updateItem = function(item){
	return axios.post(`${config.url}/${config.namespace}.UpdateItem`, item);
};

/**
* Delete Item on HLF
* @param itemId String representing the respective item ID
*/
hyperledger.deleteItem = function(itemId){
	let itemObject = {};
	itemObject.$class = `${config.namespace}.DeleteItem`;
	itemObject.item = `${hyperledger.namespaces.item}#${itemId}`;
	
	return axios.post(`${config.url}/${config.namespace}.DeleteItem`, itemObject );
}
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