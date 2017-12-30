"use strict";

var admin   = require("firebase-admin"),
    async   = require("async"),
    winston = require("winston"),
    _       = require("lodash");

var EmailQueue   = admin.database().ref("EmailQueue");

var EmailService = require("../../services/EmailService");

function EmailManager(done) {
    done = (typeof done === 'function') ? done : function() {};

    return done(null);
}

// Main
EmailQueue.on("child_added", function (new_email) {
    Carbon(new_email);
});
// Processors

function process_new_email(new_email) {

    if(!new_email.val().recipient_notified){

        winston.info("New email added: $" + new_email.key);

        if (new_email.val().type === "invite-email")
            return process_invite_email(new_email);
    }
}

function process_invite_email(email) {

    if(!email.val())
        return;

    var email_ref = EmailQueue.child(email.key).child("recipient_notified");

    email_ref.transaction(function(recipient_notified) {

        if (recipient_notified !== true) {
            return true;
        } else {
            return;
        }

    }, function(error, committed) {
        if (error) {
            winston.error('Transaction failed abnormally!', error);
        } else if (!committed) {
            winston.log("debug", 'Email already has recipient notified $' + email.key);
        } else {

            var email_address = safe(email.val().email);
            var name          = safe(email.val().name);
            var company       = safe(email.val().company);
            var user          = safe(email.val().invitee_name);

            EmailService.send_invite_email(email_address, name, company, user, function (err) {

                if(err)
                    return winston.error(err);

                winston.info("Email sent: $" + email.key + " to: " + email.val().email);

                remove_email(email);

            });
        }
    });

}

// Helpers

function valid_email(email) {

    if (email && email.val()){
        var e = email.val();

        var valid = e.type && e.email;

        if (valid)
            return true;

        winston.error("Invalid email " + email.key);

        return false;
    } else {
        winston.error("Empty email");
        return false;
    }
}

function Carbon(new_email) {

    if(valid_email(new_email)) {

        if(new_email.val().development){
            winston.info("dev email: " + new_email.key);

            if(process.env.NODE_ENV === 'production')
                return;
        } else {
            if(process.env.NODE_ENV !== 'production')
                return;
        }

        var new_email_ref = EmailQueue.child(new_email.key).child("status");

        new_email_ref.transaction(function(current_status) {

            if (current_status === null) {
                return "processing";
            } else {
                return;
            }

        }, function(error, committed) {
            if (error) {
                console.log('Transaction failed abnormally!', error);
            } else if (!committed) {
                //console.log('Message already being processed');
            } else {
                process_new_email(new_email);
            }
        });

    } else {
        winston.info("Deleting invalid email");
        EmailQueue.child(new_email.key).set(null);
    }
}

function safe(val) {
    return val ? val : null;
}

function remove_email(email) {
    EmailQueue.child(email.key).set(null, function () {
        winston.info("Email: $" + email.key + " removed from queue");
    });
}

module.exports = EmailManager;