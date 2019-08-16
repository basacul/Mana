const AWS = require('aws-sdk');
const fs = require('fs');
const config = require('../config/aws');

let aws = {};

// configuring the AWS environment
AWS.config.update({
	accessKeyId: config.aws_access_key_id,
	secretAccessKey: config.aws_secret_access_key,
	region: config.region
});

aws.s3 = new AWS.S3({apiVersion: '2006-03-01'});


/**
* Takes the actual file provided by multer and the already transformed
* filename representing a hashvalue. The key equals the path value in files
*/
aws.params = function(path){
	let params = {
		Bucket: 'mana-user-files',
		Body: fs.createReadStream(path),
		Key: path
	};
	
	return params;
};

aws.paramsRemove = function(path){
	let params = {
		Bucket: 'mana-user-files',
		Key: path
	};
	
	return params;
};

module.exports = aws;