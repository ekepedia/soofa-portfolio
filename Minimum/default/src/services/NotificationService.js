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

module.exports.send_notification = send_notification;

function send_notification (user_id, message, callback) {

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

        console.log("snoozed");

        var notification = {
            user_id: user_id,
            snooze:  snooze,
            badge:   badge
        };

        notification.title = message.val().sender_id === "system" ?
            message.val().heading :
            clean(message.val().sender_metadata.name);

        if(message.val().group_metadata)
            notification.title = clean(message.val().sender_metadata.name) + " in " + message.val().group_metadata.name + " Group";

        notification.payload = {
            message_metadata: {
                message_id:      message.key,
                sender_id:       message.val().sender_id,
                recipient_id:    message.val().recipient_id
            },
            sender_metadata: message.val().sender_metadata,
            group_metadata: message.val().group_metadata,
            scope: "message"
        };

        notification.scope = "message";

        // console.log(notification);

        // NotificationQueue.push(notification);

        return callback(null);

    });
}

module.exports.send_notification = send_message_notification;

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
        }
    }, function (err, results) {
        if(err)
            return callback(err);

        var snooze = results.muted_group || results.snooze_hours;

        send_notifications(user_id, message, results.count, snooze, callback);
    });
}

function notify(token, message, text, badge, notifier, snooze, callback) {

    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600;

    note.badge = badge;

    note.title = message.val().sender_id === "system" ?
        message.val().heading :
        clean(message.val().sender_metadata.name);

    if (!snooze) {
        note.sound = "ping.aiff";
        var hashtags = get_hashtags(message);
        note.body = hashtags ? hashtags : text;
    }

    if(message.val().group_metadata)
        note.title = clean(message.val().sender_metadata.name) + " in " + message.val().group_metadata.name + " Group";

    note.payload = {
        message_metadata: {
            message_id:      message.key,
            sender_id:       message.val().sender_id,
            recipient_id:    message.val().recipient_id
        },
        sender_metadata: message.val().sender_metadata,
        group_metadata: message.val().group_metadata,
        scope: "message"
    };

    note.topic = "ai.minimum.labs.app";

    note.contentAvailable = 1;

    console.log("sent");

    notifier.send(note, token).then( function (result) {

        if (result.failed.length !== 0 ){
            // winston.error("Deleting unusable token " + token);
            Tokens.remove_apn_token(message.val().recipient_id, token, notifier.env);
        }

        winston.info(result);

        callback(null, result);
    });

}

function set_text(message) {
    // var text = (message.val().speech_text ? emoji(message.val().speech_text) : "New message");

    var text = message.key === "system-message" ? message.val().speech_text : "New Message";

    if(message.val().photo_url !== null && message.val().photo_url !== undefined){
        text = "📷 " + text;
    }

    return text;
}


function emoji(text) {
    if(!text)
        return "";

    text = text.replace(/\b(fire)\b/ig,"🔥");

    return text;
}

function send_dev_notifications(user_id, message, count, snooze, callback) {

    Tokens.apn_tokens(user_id, "dev", function (err, tokens) {

        if(!tokens.val())
            return callback(null, null);

        tokens = _.uniq(_.keys(tokens.val()));

        async.each(tokens, function (token, cb) {

            notify(token, message, set_text(message), count, DevApnProvider, snooze, cb);

        }, function (err) {

            return callback(err);

        });
    });
}

function send_prod_notifications(user_id, message, count, snooze, callback) {

    Tokens.apn_tokens(user_id, "prod", function (err, tokens) {

        if(!tokens.val())
            return callback(null, null);

        tokens = _.uniq(_.keys(tokens.val()));

        async.each(tokens, function (token, cb) {

            notify(token, message, set_text(message), count, ProdApnProvider, snooze, cb);

        }, function (err) {

            callback(err);
        });
    });
}

function send_notifications(user_id, message, count, snooze, callback) {
    async.parallel({
        dev: function(cb) {
            send_dev_notifications(user_id, message, count, snooze, cb);
        },
        prod: function(cb) {
            send_prod_notifications(user_id, message, count, snooze, cb);
        }
    }, function(err) {
        return callback(err);
    });
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

module.exports.new_group_member = function (in_user_id, group_id, admin_id, callback) {

    if(!in_user_id || !group_id)
        return callback(Errors.MISSING_FIELDS());

    async.parallel({
        user: function (cb) {
            Users.reference.child(in_user_id).once("value", function (user) {
                cb(null, user);
            });
        },
        admin: function (cb) {
            Users.reference.child(admin_id).once("value", function (user) {
                cb(null, user);
            });
        },
        group: function (cb) {
            MySQLService.get_group(group_id, function (err, group) {
                cb(err, group[0]);
            });
        }
    }, function (err, metadata) {
        if(err){
            winston.error(err);
            return callback(Errors.API_ERROR(err));
        }

        if(!metadata.user.val() || !metadata.group || !metadata.admin.val())
            return callback(Errors.RESOURCE_NOT_FOUND());

        var name    = clean(metadata.user.val().name);
        var admin   = clean(metadata.admin.val().name);
        var group   = metadata.group.name;

        if(!name || !group || !admin)
            return callback(Errors.RESOURCE_NOT_FOUND());

        GroupService.get_recipients(group_id, function (err, users) {
            async.each(users, function (user_id, cb) {

                var title = "Welcome " + name + "!";
                var body  = name + " was just added to your group " + group + ". Jump in to say hello!";

                if(user_id === in_user_id){
                    title = group + ' Group';
                    body  = admin + " just added you to the " + group + " group. Jump in to say hello!";
                }

                NotificationQueue.push({
                    user_id: user_id,
                    title:   title,
                    body:    body,
                    scope:   "system"
                });

            }, function (err) {
                callback(err);
            });
        });

    });
};

module.exports.group_name_change = function (in_user_id, group_id, old_name, callback) {

    if(!in_user_id || !group_id || !old_name)
        return callback(true);

    async.parallel({
        user: function (cb) {
            Users.reference.child(in_user_id).once("value", function (user) {
                cb(null, user);
            });
        },
        group: function (cb) {
            MySQLService.get_group(group_id, function (err, group) {
                cb(err, group[0]);
            });
        }
    }, function (err, metadata) {
        if(err)
            return callback(err);

        if(!metadata.user.val() || !metadata.group)
            return callback(true);

        var name    = clean(metadata.user.val().name);
        var group   = metadata.group.name;

        if(!name || !group)
            return callback(true);

        GroupService.get_recipients(group_id, function (err, users) {
            async.each(users, function (user_id, cb) {
                if(user_id === in_user_id)
                    return cb(null);

                var title = old_name + ' Group';
                var body  = name + " just changed the name of your group " + old_name + ". It's now called \"" + group + "\"";

                NotificationQueue.push({
                    user_id: user_id,
                    title:   title,
                    body:    body,
                    scope:   "system"
                });
            }, function (err) {
                callback(err);
            });
        });

    });
};

module.exports.group_photo_change = function (in_user_id, group_id, callback) {

    if(!in_user_id || !group_id)
        return callback(true);

    async.parallel({
        user: function (cb) {
            Users.reference.child(in_user_id).once("value", function (user) {
                cb(null, user);
            });
        },
        group: function (cb) {
            MySQLService.get_group(group_id, function (err, group) {
                cb(err, group[0]);
            });
        }
    }, function (err, metadata) {
        if(err)
            return callback(err);

        if(!metadata.user.val() || !metadata.group)
            return callback(true);

        var name    = clean(metadata.user.val().name);
        var group   = metadata.group.name;

        if(!name || !group)
            return callback(true);

        GroupService.get_recipients(group_id, function (err, users) {
            async.each(users, function (user_id, cb) {
                if(user_id === in_user_id)
                    return cb(null);

                var title = group + ' Group';
                var body  = name + " just changed the group photo for " + group + ". Jump in to see what it is now."

                NotificationQueue.push({
                    user_id: user_id,
                    title:   title,
                    body:    body,
                    scope:   "system"
                });

            }, function (err) {
                callback(err);
            });
        });

    });
};

module.exports.new_user_active = function (in_user_id, company_id) {

    if(!in_user_id || !company_id)
        return;

    async.parallel({
        user: function (cb) {
            Users.reference.child(in_user_id).once("value", function (user) {
                cb(null, user);
            });
        },
        company: function (cb) {
            Companies.child(company_id).once("value", function (company) {
                cb(null, company);
            });
        }
    }, function (err, metadata) {
        if(err)
            return winston.error(err);

        if(!metadata.user.val() || !metadata.company.val())
            return;

        var name    = clean(metadata.user.val().name);
        var company = metadata.company.val().name;

        if(!name || !company)
            return;

        if(!metadata.user.val().active)
            try {
                Users.reference.child(in_user_id).child("active").set(new Date().getTime());
            } catch (e) {
                console.log(e);
            }

        TRIE.change(metadata.user);

        // MessageService.deliver_welcome_videos(in_user_id);

        try {
            GroupService.add_to_company_group(in_user_id, company_id);
        } catch (e) {

        }

        Users.reference.orderByChild("company_id").equalTo(company_id).once("value", function (users) {
            async.forEachOf(users.val(), function (user, user_id, cb) {
                if(user_id === in_user_id)
                    return cb(null);

                var title = "Welcome " + name + "!";
                var body  = name + " from " + company + " just joined Minimum. Jump in to say hello!";

                MySQLService.add_contact(user_id, in_user_id);
                MySQLService.add_contact(in_user_id, user_id);

                Contacts.child(user_id).child(in_user_id).set(true);
                Contacts.child(in_user_id).child(user_id).set(true);

                NotificationQueue.push({
                    user_id: user_id,
                    title:   title,
                    body:    body,
                    scope:   "system"
                });
            });
        });

    });
};

module.exports.company_wide_message = function (company_id) {

    if(!company_id)
        return;

    async.parallel({
        company: function (cb) {
            Companies.child(company_id).once("value", function (company) {
                cb(null, company);
            });
        }
    }, function (err, metadata) {
        if(err)
            return winston.error(err);

        if(!metadata.company.val())
            return;

        var company = metadata.company.val().name;

        if(!company)
            return;

        Users.reference.orderByChild("company_id").equalTo(company_id).once("value", function (users) {
            async.forEachOf(users.val(), function (user, user_id, cb) {

                var message = Messages.new_object(user_id,
                    "",
                    "Our best ideas happen on the go. Share one with your team.");

                send_notification(user_id, message, cb);
            });
        });

    });
};

function get_count(messages) {
    if(!messages)
        return 0;

    var keys = _.keys(messages);

    if(!keys || !keys.length)
        return 0;

    return keys.length;
}