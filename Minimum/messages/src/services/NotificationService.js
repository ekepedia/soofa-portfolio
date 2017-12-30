"use strict";

var apn     = require('apn'),
    async   = require('async'),
    moment  = require('moment'),
    winston = require('winston'),
    _       = require('lodash');

var options_dev = {
    token: {
        key: "src/config/APNsAuthKey_NV3T37DN9R.p8",
        keyId: "NV3T37DN9R",
        teamId: "G2Q624MGXV"
    },
    production: false
};

var options_prod = {
    token: {
        key: "src/config/APNsAuthKey_NV3T37DN9R.p8",
        keyId: "NV3T37DN9R",
        teamId: "G2Q624MGXV"
    },
    production: true
};

var DevApnProvider  = new apn.Provider(options_dev);
var ProdApnProvider = new apn.Provider(options_prod);

DevApnProvider.env  = "dev";
ProdApnProvider.env = "prod";

var Tokens              = require("../models/Tokens"),
    Users               = require("../models/Users"),
    UnreadMessages      = require("../models/UnreadMessages"),
    Messages            = require("../models/Messages"),
    ConversationService = require("../services/ConversationService"),
    GroupService        = require("../services/GroupService"),
    MessageService      = require("../services/MessageService"),
    MySQLService        = require("../services/MySQLService");

var TRIE        = require("../managers/managers/TRIE");

TRIE = new TRIE(false, true);

var admin        = require("firebase-admin"),
    GroupMembers = admin.database().ref("GroupMembers"),
    Companies    = admin.database().ref("Companies"),
    Contacts     = admin.database().ref("Contacts"),
    Groups       = admin.database().ref("Groups");

var Errors = require("../helpers/Errors");

var NotificationQueue = admin.database().ref("NotificationQueue");

module.exports.send_message_notification = send_message_notification;

function send_message_notification (user_id, message, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!message || !message.val || !message.val())
        return callback(new Error("Invalid message"));

    if(user_id === message.val().sender_id && user_id !== message.val().recipient_id)
        return callback(null);

    async.parallel({
        count: function (cb) {
            MySQLService.count_unwatched(user_id, 4, function (err, users) {
                if(err)
                    return cb(err);

                var count = users.indexOf(message.val().sender_id) === -1 ?
                    ( message.val().sender_id === "system" ?
                            users.length :
                            users.length + 1
                    ) :
                    users.length;

                return cb(null, count)
            });
        },
        muted_group: function (cb) {
            MySQLService.get_muted_groups(user_id, function (err, groups) {
                if(err || !groups || groups.length === 0)
                    return cb(err, false);

                var muted_group = groups.indexOf(message.val().recipient_id) !== -1;

                return cb(err, muted_group)
            });
        },
        snooze_hours: function (cb) {
            MySQLService.get_snooze_hours(user_id, function (err, hours) {
                if(err || !hours)
                    return cb(err, false);

                var time = new Date().getUTCHours()*60 + new Date().getUTCMinutes();
                var date = new Date().getTime();

                var snooze_time = time <= hours.start_time || time >= hours.end_time;

                if(hours.end_time < hours.start_time)
                    snooze_time = !(time <= hours.end_time || time >= hours.start_time);

                var snooze_date = date <= hours.active_date;

                return cb(err, (snooze_time || snooze_date));
            });
        }
    }, function (err, results) {
        if(err)
            return callback(err);

        var snooze = results.muted_group || results.snooze_hours;
        var badge  = results.count;

        var notification = {
            user_id: user_id,
            snooze:  snooze,
            badge:   badge
        };

        send_notification(notification, message, callback);

    });
}

function send_notification(notification, message, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};


    notification.title = message.val().sender_id === "system" ?
        message.val().heading :
        clean(message.val().sender_metadata.name);

    var hashtags = get_hashtags(message);
    notification.body = hashtags ? hashtags : set_text(message);

    if(message.val().group_metadata)
        notification.title = clean(message.val().sender_metadata.name) + " in " + message.val().group_metadata.name + " Group";

    notification.payload = {
        message_metadata: {
            message_id:      safe(message.key),
            sender_id:       safe(message.val().sender_id),
            recipient_id:    safe(message.val().recipient_id)
        },
        sender_metadata:     safe(message.val().sender_metadata),
        group_metadata:      safe(message.val().group_metadata),
        scope:               "message"
    };

    notification.scope = "message";

    NotificationQueue.push(notification);

    return callback(null);
}

function set_text(message) {

    var text = message.key === "system-message" ? message.val().speech_text : "New Message";

    if(message.val().photo_url !== null && message.val().photo_url !== undefined){
        text = "📷 " + text;
    }

    return text;
}


function clean(name) {
    if(!name) return "Unknown";

    var names = name.split(" ");
    return names.length > 1 ? names[0] : name;
}

function get_hashtags(message) {
    var hashtags = [];

    if(!message || !message.val || !message.val() || !message.val().speech_text)
        return;

    if(message.val().keywords)
        _.each(message.val().keywords, function (key) {
            if(key.relevance > 0.6)
                hashtags.push(key.text.split(" ").join("").toLowerCase());
        });

    if(message.val().entities)
        _.each(message.val().entities, function (key) {
            if(key.type === "Person" || key.type === "Location" || key.type === "Company")
                hashtags.push(key.text.split(" ").join("").toLowerCase());
        });

    hashtags = _.union([""], _.uniq(hashtags));

    hashtags = hashtags.join(" #").trim();

    return hashtags;
}

function safe(val) {
    return val ? val : null;
}