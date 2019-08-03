const templates = {};

templates.reset = function(username, email, token){
	let html = `<h3>Hi ${username}!</h3><br>` +
				`<p>Send this email to ${email}.<p><br>`;
	
	if(!token){
		html += "<p>A new password has been requested with your current verification token and your account " + 
				"is still accessible with your current credentials.</p>"+
				"<p>In case you have not requested a new password you should" +
				" immediately contact us in order to protect your account from any harm.</p><br>";
	}else{
		html += "<p>A new password has been requested without or a wrong verification token and your account was set to inactive.</p>" + 
				"<p>Please set your new password together with your new verification token. Please keep your token in " +
				"a safe place as it will be used in the future.</p>"+
				"<p>In case you have not requested a new password, you should immediately contact us in order to protect your account from any harm.</p><br>" +
				"<p>Token: <strong> " + token + "</strong></p><br>";
	}
	
	html += "<p>Follow this link to reset your password:<br>" +
			"<a href='https://mana-prototype.run.goorm.io/reset'>https://mana-prototype.run.goorm.io/reset</a></p><br><br>" +
			"See you soon!<br>" +
			"Openhealth.care";
	
	return html;
};

templates.verification = function(username, email, token){
	
	let html = `<h3>Hi ${username}!</h3><br>` +
				`<p>Send this email to ${email}.<p><br>` +
				 "<p>Thank you for registering to Mana!</p>" +
				"<p>Please verify your account together with your verification token. Please keep your token in " +
				"a safe place as it will be used in the future.</p><br>" +
				"<p>Token: <strong> " + token + "</strong></p><br>" +
				"<p>Follow this link and provide your username and verification token:<br>" +
				"<a href='https://mana-prototype.run.goorm.io/verification'>https://mana-prototype.run.goorm.io/verification</a></p><br><br>" +
				"See you soon!<br>" +
				"Openhealth.care";
	
	return html;
};

module.exports = templates;