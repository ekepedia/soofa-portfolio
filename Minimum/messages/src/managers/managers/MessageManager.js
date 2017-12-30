"use strict";

var admin   = require("firebase-admin"),
    async   = require("async"),
    winston = require("winston"),
    _       = require("lodash");

var ActiveUsers = admin.database().ref("ActiveUsers");

var moment = require('moment'); 

var MessageService       = require("../../services/MessageService");
var ConversationService  = require("../../services/ConversationService");
var NotificationService  = require("../../services/NotificationService");
var MySQLService         = require("../../services/MySQLService");
var UserService          = require("../../services/UserService");
var GroupService         = require("../../services/GroupService");
var StoryService         = require("../../services/StoryService");
var SlackService         = require("../../services/SlackService");
var NLU                  = require("../../managers/managers/NLU");
var FeedbackService      = require("../../services/FeedbackService");

var nlu                  = new NLU();

function MessageManager(done) {
    done = (typeof done === 'function') ? done : function() {};

    return done(null);
}

// Main
MessageService.reference.limitToLast(1).on("child_added", function (new_message) {
    Carbon(new_message);
});
// Processors

function process_new_message(new_message) {

    if(!new_message.val().recipient_notified){

        console.time("Total time to process message $" + new_message.key);
        console.time("Total time waited for message $" + new_message.key);
        winston.info("New message added: $" + new_message.key);

        MessageService.detach_listener(new_message.key);

        set_metadata(new_message);

        winston.info("Adding listener to message $" + new_message.key);

        nlu.process_message(new_message);

        GroupService.find_by_id(new_message.val().recipient_id, function (err, group) {

            if(!group || !group.val || !group.val()) {
                return listen_to_message_change(new_message);

            } else {
                MessageService.reference
                    .child(new_message.key)
                    .child("group_metadata")
                    .set(group.val(), function (err) {
                        if(err)
                            winston.error(err);

                        GroupService.get_recipients(new_message.val().recipient_id, function (err, recipients) {
                            listen_to_message_change(new_message, group, recipients);
                        });
                    });
            }
        });
    }
}

function process_message_change(message, group, recipients) {

    if(!message.val())
        return;

    if(message.val().cancelled){
        winston.log("debug", "Message $" + message.key +" cancelled");
        MessageService.detach_listener(message.key);
        MessageService.deleteOne(message.key, function () {
            winston.log("debug", "Message $" + message.key +" deleted");
        });
        return;
    }

    if(
        (message.val().video_url || message.val().photo_url) &&
        message.val().sender_metadata &&
        !message.val().recipient_notified &&
        ((group && message.val().group_metadata) || !group )
    ){

        var message_ref = MessageService.reference.child(message.key).child("recipient_notified");

        message_ref.transaction(function(recipient_notified) {

            if (recipient_notified !== true) {
                return true;
            } else {
                return;
            }

        }, function(error, committed) {
            if (error) {
                winston.error('Transaction failed abnormally!', error);
            } else if (!committed) {
                winston.log("debug", 'Message already has recipient notified $' + message.key);
            } else {

                if(message.val().mov_url)
                    winston.info("$" + message.key + " mov_url: " + short_aws_url(message.val().mov_url));

                if(message.val().photo_url)
                    winston.info("$" + message.key + " photo_url: " + short_aws_url(message.val().photo_url));

                MessageService.detach_listener(message.key);

                console.timeEnd("Total time waited for message $"+ message.key);
                console.time("Total time to run functions for $"+ message.key);

                async.parallel({
                    notify: function (cb) {
                        notify(message, recipients, cb);
                    }
                }, function (err) {
                    console.timeEnd("Total time to run functions for $" + message.key);
                    console.timeEnd("Total time to process message $" +   message.key);

                    MySQLService.push_message(message, function (err, sql_message) {
                        if(err)
                            return winston.error(err);

                        sql_message.created_at = sql_message.created_at.getTime();

                        winston.info("message $" + message.key + " added to SQL database");

                        last_message(message, sql_message, recipients);

                        FeedbackService.broadcast_message(message);
                        FeedbackService.redirect_message(message);

                        StoryService.post_to_story(message);

                    });

                });
            }
        });

    }
}

function notify(message, recipients, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    recipients = recipients ? _.without(recipients, message.val().sender_id) : [message.val().recipient_id];

    console.time("Total time between recording end and notification $" + message.key);

    async.each(recipients, function (recipient, cb) {

        /*NotificationService.send_notification(recipient, message, function (err, result) {
            winston.info("Message $" + message.key + " receiver " + recipient + " notified");
            cb(null);
        });*/

        NotificationService.send_message_notification(recipient, message, function (err, result) {
            winston.info("Message $" + message.key + " receiver " + recipient + " notified");
            cb(null);
        });

    }, function (err) {
        console.timeEnd("Total time between recording end and notification $" + message.key);
        callback(null);
    });

}

function last_message(message, sql_message, recipients) {

    var group_id = recipients ? message.val().recipient_id : null;

    // Last message of the group
    if (group_id)
        ConversationService.reference
            .child(message.val().recipient_id)
            .child("last_message")
            .set({
                message_id: message.key,
                sender_id: message.val().sender_id,
                group_id: group_id,
                speech_text: message.val().speech_text ? message.val().speech_text : null,
                created_at: message.val().created_at
            });

    recipients  = recipients ? _.without(recipients, message.val().sender_id) : [message.val().recipient_id];

    // Last message of each person in the group / person
    async.each(recipients, function (recipient, cb) {

        ConversationService.reference
            .child(recipient)
            .child("last_message")
            .set({
                message_id: message.key,
                sender_id: message.val().sender_id,
                group_id: group_id,
                speech_text: message.val().speech_text ? message.val().speech_text : null,
                created_at: message.val().created_at
            });

        cb(null);
    });

}

// Helpers

function valid_message(message) {

    if (message && message.val()){
        var m = message.val();

        var valid = m.sender_id && m.recipient_id && m.created_at && m.origin;

        if (valid)
            return true;

        winston.info("Invalid message " + message.key);

        return false;
    } else {
        winston.info("Empty message");

        return false;
    }

}

function Carbon(new_message) {

    if(valid_message(new_message)) {

        if(new_message.val().development){
            winston.info("dev message: " + new_message.key);

            if(process.env.NODE_ENV === 'production')
                return;
        } else {
            if(process.env.NODE_ENV !== 'production')
                return;
        }

        var new_message_ref = MessageService.reference.child(new_message.key).child("status");

        new_message_ref.transaction(function(current_status) {

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
                process_new_message(new_message);
            }
        });

    } else {
        winston.info("Deleting invalid message");
        MessageService.reference.child(new_message.key).set(null);
    }
}

function set_metadata(message) {

    console.time("Time to set metadata for " + message.key);

    UserService.getOne(message.val().sender_id.toString(), function (err, user) {

        if(user.val()){

            MessageService.reference
                .child(message.key)
                .child("sender_metadata")
                .set({
                    name:       safe(user.val().name),
                    company:    safe(user.val().company),
                    company_id: safe(user.val().company_id),
                    photo_url:  safe(user.val().photo_url)
                }, function () {
                    console.timeEnd("Time to set metadata for " + message.key);
                });

            try {

                var active_time  = message.val().created_at;
                var user_id      = message.val().sender_id;

                var user_metadata = {
                    user_id:   user_id,
                    name:      safe(user.val().name),
                    company:   safe(user.val().company),
                    photo_url: safe(user.val().photo_url)
                };

                ActiveUsers.child(user_id).child("last_active").set(active_time);
                ActiveUsers.child(user_id).child("user_metadata").set(user_metadata);

            } catch (e) {
                winston.error(e);
            }


        }
    });
}

function safe(val) {
    return val ? val : null;
}

function listen_to_message_change (new_message, group, recipients) {
    MessageService.reference.child(new_message.key).on("value", function (message) {
        if (message.val()) {
            return process_message_change(message, group, recipients);
        }
    });
}

function short_aws_url(string) {
    return string.replace("https://s3.amazonaws.com/minimumvideoupload-deployments-mobilehub-1450667936", "");
}

module.exports = MessageManager;