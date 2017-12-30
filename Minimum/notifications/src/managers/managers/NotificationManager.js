"use strict";

var apn     = require('apn'),
    admin   = require("firebase-admin"),
    async   = require("async"),
    winston = require("winston"),
    _       = require("lodash");

var options_dev = {
    token: {
        key: "src/config/APNsAuthKey_NV3T37DN9R.p8"
    },
    production: false
};

var options_prod = {
    token: {
        key: "src/config/APNsAuthKey_NV3T37DN9R.p8",
    },
    production: true
};

var DevApnProvider  = new apn.Provider(options_dev);
var ProdApnProvider = new apn.Provider(options_prod);

DevApnProvider.env  = "dev";
ProdApnProvider.env = "prod";

var NotificationQueue = admin.database().ref("NotificationQueue");

var Tokens              = require("../../models/Tokens"),
    MySQLService        = require("../../services/MySQLService");

function NotificationManager(done) {
    done = (typeof done === 'function') ? done : function() {};

    return done(null);
}

// Main
NotificationQueue.on("child_added", function (new_notification) {
    Carbon(new_notification);
});

// Helpers

function valid_notification(notification) {

    if (notification && notification.val()){
        var n = notification.val();

        var valid = n.user_id && n.scope;

        if (valid)
            return true;

        winston.error("Invalid notification " + notification.key);

        return false;
    } else {
        winston.error("Empty notification");
        return false;
    }
}

function Carbon(new_notification) {

    if(valid_notification(new_notification)) {

        if(new_notification.val().development){
            winston.info("dev email: " + new_notification.key);

            if(process.env.NODE_ENV === 'production')
                return;
        } else {
            if(process.env.NODE_ENV !== 'production')
                return;
        }

        var new_notification_ref = NotificationQueue.child(new_notification.key).child("status");

        new_notification_ref.transaction(function(current_status) {

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
                process_new_notification(new_notification);
            }
        });

    } else {
        winston.info("Deleting invalid email");
        remove_notification(new_notification);
    }
}

function remove_notification(notification) {
    NotificationQueue.child(notification.key).set(null, function () {
        winston.info("Notification: $" + notification.key + " removed from queue");
    });
}

function process_new_notification(notification) {

    if(!notification || !notification.val || !notification.val())
        return callback(new Error("Invalid notification"));

    var user_id = notification.val().user_id;

    MySQLService.get_snooze_hours(user_id, function (err, hours) {
        if(err || !hours)
            return cb(err, false);

        var time = new Date().getUTCHours()*60 + new Date().getUTCMinutes();
        var date = new Date().getTime();

        var snooze_time = time <= hours.start_time || time >= hours.end_time;

        if(hours.end_time < hours.start_time)
            snooze_time = !(time <= hours.end_time || time >= hours.start_time);

        var snooze_date = date <= hours.active_date;

        var snooze = (snooze_time || snooze_date) || notification.val().snooze;

        send_notifications(notification.val(), snooze, function (err) {
            if (err)
                return winston.error(err);

            remove_notification(notification);
        });
    });

}

function send_notifications(notification, snooze, callback) {
    async.parallel({
        dev: function(cb) {
            send_dev_notifications(notification, snooze, cb);
        },
        prod: function(cb) {
            send_prod_notifications(notification, snooze, cb);
        }
    }, function(err) {
        return callback(err);
    });
}

function send_prod_notifications(notification, snooze, callback) {

    var user_id = notification.user_id;

    Tokens.apn_tokens(user_id, "prod", function (err, tokens) {

        if(!tokens.val())
            return callback(null, null);

        tokens = _.uniq(_.keys(tokens.val()));

        async.each(tokens, function (token, cb) {

            notify(token, ProdApnProvider, notification, snooze, cb);

        }, function (err) {

            callback(err);
        });
    });
}

function send_dev_notifications(notification, snooze, callback) {

    var user_id = notification.user_id;

    Tokens.apn_tokens(user_id, "dev", function (err, tokens) {

        if(!tokens.val())
            return callback(null, null);

        tokens = _.uniq(_.keys(tokens.val()));

        async.each(tokens, function (token, cb) {

            notify(token, DevApnProvider, notification, snooze, cb);

        }, function (err) {

            return callback(err);

        });
    });
}

function notify(token, notifier, notification, snooze, callback) {

    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600;

    if (notification.badge)
        note.badge = notification.badge;

    if (notification.title)
        note.title = notification.title;

    if (!snooze) {
        note.sound = "ping.aiff";

        if (notification.body)
            note.body = notification.body;
    }

    note.payload = notification.payload || {};

    note.payload.scope = notification.scope;

    note.topic = "ai.minimum.labs.app";

    note.contentAvailable = 1;

    notifier.send(note, token).then( function (result) {

        if (result.failed.length !== 0 ){
            Tokens.remove_apn_token(notification.user_id, token, notifier.env);
        }

        winston.info(notification.user_id + ": \t" + JSON.stringify(result));

        callback(null, result);
    });

}

module.exports = NotificationManager;