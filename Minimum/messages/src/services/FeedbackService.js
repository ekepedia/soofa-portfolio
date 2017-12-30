"use strict";

var _       = require("lodash"),
    winston = require("winston");

var Errors = require("../helpers/Errors");

var admin    = require("firebase-admin"),
    Messages = admin.database().ref("Messages");

var MySQLService = require("../services/MySQLService"),
    GroupService = require("../services/GroupService");

var support_users = ["20", "7", "8", "34"];

module.exports.broadcast_message = function (message, callback) {

    callback = (typeof callback === 'function') ? callback : function () {};

    if(!message || !message.key || !message.val || !message.val())
        return callback(Errors.MISSING_FIELDS());

    var recipient_id = message.val().recipient_id,
        sender_id    = message.val().sender_id,
        created_at   = message.val().created_at;

    if(recipient_id !== process.env.FEEDBACK_AND_SUPPORT_USER_ID)
        return callback(null, null);

    winston.info("broadcast support message: " + message.key);

    var group_id  = "" + process.env.FEEDBACK_AND_SUPPORT_PREFIX + sender_id,
        name      = "Support " + sender_id,
        photo_url =  "" +  process.env.FEEDBACK_AND_SUPPORT_LOGO;

    winston.info("set fields: " + message.key);

    GroupService.add_group(group_id, name, photo_url, function (err) {
        winston.info("created group: " + message.key);

        GroupService.add_group_members(group_id, support_users, function () {
            winston.info("added group members: " + message.key);

            var support_message = {
                created_at:      created_at,
                origin:          message.val().origin,
                recipient_id:    group_id,
                speech_text:     message.val().speech_text || null,
                sender_id:       sender_id,
                development:     message.val().development || null,
                mov_url:         message.val().mov_url     || null,
                photo_url:       message.val().photo_url   || null
            };

            winston.info(support_message);

            var new_message = Messages.push(support_message);

            winston.info("new message pushed: " + message.key);
            winston.info("new key for " + message.key + ": " + new_message.key);
        });
    });
};

module.exports.redirect_message = function (message, callback) {

    callback = (typeof callback === 'function') ? callback : function () {};

    if(!message || !message.key || !message.val || !message.val())
        return callback(Errors.MISSING_FIELDS());

    var recipient_id = message.val().recipient_id;

    if(!is_support_group(recipient_id))
        return callback(null, null);

    winston.info("redirect support message: " + message.key);

    var user_id    = extract_user(recipient_id),
        created_at = new Date().getTime();

    if(message.val().sender_id === user_id)
        return callback(null, null);

    Messages.push({
        created_at:      created_at,
        mov_url:         message.val().mov_url       || null,
        photo_url:       message.val().photo_url     || null,
        origin:          message.val().origin,
        recipient_id:    user_id,
        sender_id:       process.env.FEEDBACK_AND_SUPPORT_USER_ID,
        speech_text:     message.val().speech_text     || null,
        development:     message.val().development     || null
    });

};

function is_support_group(group) {
    return group.indexOf(process.env.FEEDBACK_AND_SUPPORT_PREFIX) === 0;
}

function extract_user(group) {
    return group.slice(process.env.FEEDBACK_AND_SUPPORT_PREFIX.length);
}