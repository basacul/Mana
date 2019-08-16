const accessKey = '';
const secretAccessKey = '';

module.exports = {
	aws_access_key_id: process.env.AWS_ACCESS_KEY_ID || accessKey,
	aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY || secretAccessKey,
	region: 'eu-central-1'
}
