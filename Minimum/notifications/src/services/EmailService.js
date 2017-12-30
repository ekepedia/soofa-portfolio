var nodemailer = require("nodemailer");
var _ = require("lodash");
var fs = require("fs");

var fradmin   = require("firebase-admin"),
    Companies = fradmin.database().ref("Companies"),
    Users     = fradmin.database().ref("Users");

var daily = "eke@minimum.ai, a@minimum.ai, f@minimum.ai, jun@minimum.ai";

var admin = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: process.env.MINIMUM_ADMIN_EMAIL,
        pass: process.env.MINIMUM_ADMIN_PASSWORD
    }
});

module.exports.send_admin_email = function (to, subject, message, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    fs.readFile('./src/emails/message.html', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }

        var body = data
            .replace('{{ message }}', message)
            .replace('{{ message }}', message)
            .replace('{{ message }}', message)
            .replace('{{ title }}', subject)
            .replace('{{ title }}', subject)
            .replace('{{ title }}', subject);

        var mailOptions = {
            from:    "Minimum Team <"+process.env.MINIMUM_ADMIN_EMAIL+">",
            to:      to,
            subject: subject,
            html:    body
        };

        admin.sendMail(mailOptions, function(err){
            callback(err);
        });

    });

};

module.exports.send_reset_password_email = function (email, name, token, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    fs.readFile('./src/emails/reset_password.html', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }

        var body = data
            .replace('{{ name }}', name)
            .replace('{{ token }}', token);

        var mailOptions = {
            from:    "Minimum Team <"+process.env.MINIMUM_ADMIN_EMAIL+">",
            to:      email,
            subject: "Reset Password",
            html:    body
        };

        admin.sendMail(mailOptions, function(err){
            callback(err);
        });

    });

};

module.exports.send_password_reset_email = function (email, name, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    fs.readFile('./src/emails/password_reset.html', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }

        var body = data
            .replace('{{ name }}', name);

        var mailOptions = {
            from:    "Minimum Team <"+process.env.MINIMUM_ADMIN_EMAIL+">",
            to:      email,
            subject: "Password Reset",
            html:    body
        };

        admin.sendMail(mailOptions, function(err){
            callback(err);
        });

    });

};

module.exports.daily_email = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    var a_day_ago = new Date().getTime() - 24*60*60*1000;

    Users.orderByChild("active").startAt(a_day_ago).once("value", function (users) {
        if(!users.val())
            return callback(null);

        var names = "";

        _.each(users.val(), function (p) {
            names += p.name +", " + p.company +", " + p.email + "\n";
        });

        var message = "New Users:\n\n" + names;

        var mailOptions = {
            from: process.env.MINIMUM_ADMIN_EMAIL,
            to: daily,
            subject: "Minimum Daily Digest",
            text: message
        };

        admin.sendMail(mailOptions, function(err){
            callback(err);
        });

    });
};

module.exports.send_invite_email = function (email, name, company, user, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    fs.readFile('./src/emails/invite_email.html', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }

        var from = name + " <"+process.env.MINIMUM_ADMIN_EMAIL+">";

        user = user.split(" ")[0];

        var body = data
            .replace(/{{name}}/g, name)
            .replace(/{{company}}/g, company)
            .replace(/{{user}}/g, user);

        var subject = name + " Invites You To Join " + company + " On Minimum";

        var mailOptions = {
            from:    from,
            to:      email,
            subject: subject,
            html:    body
        };

        admin.sendMail(mailOptions, function(err){
            callback(err);
        });

    });

};

