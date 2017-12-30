"use strict";

var Messages     = require("../models/Messages"),
    MySQLService = require("../services/MySQLService"),
    UserService  = require("../services/UserService");

var winston      = require("winston");

var Errors = require("../helpers/Errors");

var _  = require("lodash");

var videos = require("../data/welcome-videos");

module.exports.getAll          = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Messages.all(callback);
};

module.exports.deleteOne       = function (id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Messages.delete(id, callback);
};

module.exports.getOne          = function (id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Messages.findById(id, callback);

    // MySQLService.single_message(id, callback);
};

module.exports.update          = function (id, data, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    data     = (typeof data === 'object') ? data : {};

    Messages.update(id, data, callback);
};

module.exports.watch_message   = function (message_id, watched, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};
    watched  = (typeof watched === 'object') ? watched : {};

    try {
        watched = watched_object(watched);
    } catch (err) {
        return callback(Errors.INVALID_JSON_PAYLOAD());
    }

    Messages.reference.child(message_id).child("watched").update(watched, function (err) {
        // winston.info("watched message $" + message_id + "; who " + JSON.stringify(watched));
        return callback(err);
    });

    // TODO Only listen to SQL response
    MySQLService.watch_message(message_id, watched);
};

module.exports.deliver_message   = function (message_id, delivered, callback) {

    callback  = (typeof callback === 'function') ? callback  : function() {};
    delivered = (typeof delivered === 'object')  ? delivered : {};

    try {
        delivered = delivered_object(delivered);
    } catch (err) {
        return callback(Errors.INVALID_JSON_PAYLOAD());
    }

    MySQLService.deliver_message(message_id, delivered, callback);
};

module.exports.detach_listener = function (message_id, watched) {
    if (watched){
        console.log("Detach $" + message_id + " watch listener");
        return Messages.reference.child(message_id).child("watched").off();

    }

    console.log("Reset and clear all $" + message_id + " listeners");
    Messages.reference.child(message_id).off();

};

module.exports.reference = Messages.reference;

function watched_object (watched) {
    _.each(_.keys(watched), function (key) {
        watched[key] = (typeof watched[key] !== 'string') ? watched[key] : JSON.parse(watched[key]);
    });

    return watched;
}

function delivered_object (delivered) {
    _.each(_.keys(delivered), function (key) {
        delivered[key] = (typeof delivered[key] !== 'string') ? delivered[key] : JSON.parse(delivered[key]);
    });

    return delivered;
}


module.exports.new          = new_message;

function new_message (data, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if (!data || typeof data !== 'object')
        return callback(Errors.MISSING_FIELDS());

    data = (typeof data === 'object') ? data : {};

    Messages.new(data, callback);
}

module.exports.deliver_welcome_videos = deliver_welcome_videos;

function deliver_welcome_videos(user_id) {

    UserService.getOne(user_id, function (err, user) {

        user = user.val();

        if(!user) {
            return winston.error("User not found");
        }

        winston.info("Delivering welcome messages to: " + user.user_id);

        var active_time = new Date().getTime();

        if(!user.active) {
            winston.error("User did not have an active time; Setting to now");
        } else {
            active_time = user.active;
        }

        var one_minute = 60*1000;

        active_time = active_time - 60 * one_minute;

        var messages = _.map(videos, function (video) {
            video.created_at      = active_time + video.created_at * one_minute;
            video.recipient_id    = user_id;
            video.sender_metadata = {
                photo_url:  process.env.FEEDBACK_AND_SUPPORT_LOGO,
                name:       "Minimum Team",
                company:    "Minimum, Inc.",
                company_id: "-Km3nItA9obbW4q9I4gz"
            };
            return video;
        });

        _.each(messages, function (message, index) {

            var message_id = "welcome-" + index + "@" + user_id;

            message = MySQLService.convert_to_firebase_object(message_id, message);

            MySQLService.push_message(message, function (err) {
                if(err) {
                    winston.error("Error when trying to send welcome videos: " + err.sqlMessage);
                    winston.error("Error when trying to send welcome videos: " + JSON.stringify(message, null, 4));

                } else {
                    winston.info("message $" + message.key + " added to SQL database");
                }
            });
        });
    });
}
