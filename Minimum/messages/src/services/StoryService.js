"use strict";

var _       = require("lodash"),
    winston = require("winston");

var Errors = require("../helpers/Errors");

var admin    = require("firebase-admin"),
    Messages = admin.database().ref("Messages");

var MySQLService = require("../services/MySQLService");

module.exports.post_to_story = function (message, callback) {

    callback = (typeof callback === 'function') ? callback : function () {};

    if(!message || !message.key || !message.val || !message.val())
        return callback(Errors.MISSING_FIELDS());

    if(!is_story(message))
        return callback(null, null);

    winston.info("Posting message to story: " + message.key);

    try {
        var user_id    = message.val().sender_id,
            message_id = message.key;

        MySQLService.add_story(user_id, message_id, callback);

    } catch (e) {
        winston.error(e);
    }

};

function is_story(message) {
    return message.val().recipient_id === process.env.STORY_USER_ID
}