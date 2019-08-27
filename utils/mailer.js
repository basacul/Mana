// const mailgun = require('mailgun-js');
// const config = require('../config/mailer');


// const mg = mailgun({
// 	apiKey: process.env.MAILGUN_API_KEY || config.API_KEY,
// 	domain: process.env.MAILGUN_DOMAIN || config.DOMAIN
// });


// module.exports = {
// 	sendEmail(from, to, subject, html){
		
// 		const data = {
// 			from: `Excited user <${from}>`,
// 			to: `${to}, antelo.b.lucas@gmail.com`,
// 			subject: `${subject}`,
// 			text: `${html}`
// 		};
		
// 		return new Promise((resolve, reject) => {
// 			mg.messages().send(data, (error, body) => {
// 				if(error){
// 					reject(error);
// 				}else{
// 					resolve(body);
// 				}
// 			});
			
// 		});
// 	}
// };  
	  
const nodemailer = require('nodemailer');
const config = require('../config/mailer');

const transport = nodemailer.createTransport({
	service: 'Mailgun',
	auth: {
		user: process.env.MAILGUN_USER || config.MAILGUN_USER,
		pass: process.env.MAILGUN_PASS || config.MAILGUN_PASS
	},
	tls: {
		rejectUnauthorized: false
	}
});

module.exports = {
	sendEmail(from, to, subject, html){
		return new Promise((resolve, reject) => {
			transport.sendMail({from, subject, to, html}, (err, info) => {
				if(err){
					reject(err);
				}else{
					resolve(info);
				}
			});
		});
	}
};