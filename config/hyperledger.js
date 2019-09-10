const hostname = '195.48.32.162';
const baseUrl = `https://${hostname}`;
const port = 3000;
const url = `${baseUrl}:${port}/api`;
const namespace = 'care.openhealth.mana';

module.exports = {
	hostname: hostname,
	baseUrl: baseUrl,
	port: port,
	url : url,
	namespace: namespace
};