"use strict";

var slack = require('@slack/client');

module.exports.notify = function (message_id, text, results, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    var IncomingWebhook = slack.IncomingWebhook;

    var url = process.env.SLACK_WEBHOOK_MINIMUMLOGGER;

    var webhook = new IncomingWebhook(url);

    var message = {
        "text":
        "\nMessage Id: " + message_id +
        "\nText: " + text +
        "\nResults: \n\n```" +JSON.stringify(results, null, 2)+"```"
    };

    webhook.send(message, function(err, res) {
        if (err) {
            return callback(err);
        } else {
            return callback(null);
        }
    });
};

module.exports.bugs = function (message, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!message || !message.val || !message.val() || !(message.val().mov_url || message.val().photo_url) || !message.val().sender_metadata)
        return;

    var IncomingWebhook = slack.IncomingWebhook;

    var url = process.env.SLACK_WEBHOOK_MINIMUMLOGGER_BUGS;

    var webhook = new IncomingWebhook(url);

    var out_message = {
        "username": "minimum-bugs",
        "text": "New Bug From " + message.val().sender_metadata.name,
        "attachments": [
            {
                "text": "Bugs: " + message.val().speech_text +
                "\nVideo: <"+ message.val().mov_url +"|Click Here> or <https://minimum-node-api.appspot.com/admin/groups/A5992AC9-C00E-43E0-A61E-EA81AE98299B?id="+message.key+"|View in Dashboard>"
            }
        ]
    };

    webhook.send(out_message, function(err, res) {
        if (err) {
            return callback(err);
        } else {
            return callback(null);
        }
    });
};


module.exports.gasbuddy = function (message, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!message || !message.val || !message.val() || !(message.val().mov_url || message.val().photo_url) || !message.val().sender_metadata)
        return;

    var IncomingWebhook = slack.IncomingWebhook;

    var url = process.env.SLACK_WEBHOOK_MINIMUMLOGGER_GASBUDDY;

    var webhook = new IncomingWebhook(url);

    var out_message = {
        "attachments": [
            {
                "color": "#5430ef",
                "title": message.val().sender_metadata.name,
                "text": message.val().speech_text,
                "footer": "Sent on <https://minimum-node-api.appspot.com/admin/groups/F842C4FE-E264-4A9A-8924-7CA6DD5D916A?id="+message.key+" | Minimum> ",
                "footer_icon": message.val().sender_metadata.photo_url,
                "ts": message.val().created_at/1000
            }
        ]
    };

    webhook.send(out_message, function(err, res) {
        if (err) {
            return callback(err);
        } else {
            return callback(null);
        }
    });
};