"use strict";

var Knex    = require('knex'),
    crypto  = require('crypto'),
    _       = require('lodash'),
    async   = require('async'),
    winston = require("winston");


var admin  = require("firebase-admin"),
    Users  = admin.database().ref("Users"),
    Groups = require("../models/Groups");

var Errors = require("../helpers/Errors");

var knex;
var init = false;

var required_message_keys = [
    "message_id",
    "created_at",
    "origin",
    "recipient_id",
    "sender_id",
    "sender_metadata"
];

var optional_message_keys = [
    "video_url",
    "watched",
    "delivered",
    "speech_text",
    "nlp",
    "group_metadata",
    "mov_url",
    "photo_url",
    "recipient_metadata"
];

var received =
    "(SELECT COUNT(message_id) as received, recipient_id from messages " +
    "GROUP BY recipient_id) received";

var sent =
    "(SELECT COUNT(message_id) as sent, sender_id from messages " +
    "GROUP BY sender_id) sent";

var received_24 =
    "(SELECT COUNT(message_id) as received_24, recipient_id from messages " +
    "WHERE created_at >= DATE_ADD(CURDATE(), INTERVAL -1 DAY) " +
    "GROUP BY recipient_id) messages_received_24";

var sent_24 =
    "(SELECT COUNT(message_id) as sent_24, sender_id from messages " +
    "WHERE created_at >= DATE_ADD(CURDATE(), INTERVAL -1 DAY) " +
    "GROUP BY sender_id) messages_sent_24";

var daily_sent =
    "(SELECT AVG(daily_sent.total) as sent_daily, user_id " +
    "FROM (SELECT CAST(created_at AS DATE) as DateField, COUNT(message_id) as total, sender_id as user_id " +
    "FROM messages GROUP BY sender_id, DateField) as daily_sent " +
    "GROUP BY user_id) as messages_sent_daily";

var daily_received =
    "(SELECT AVG(daily_received.total) as received_daily, user_id " +
    "FROM (SELECT CAST(created_at AS DATE) as DateField, COUNT(message_id) as total, recipient_id as user_id " +
    "FROM messages GROUP BY recipient_id, DateField) as daily_received " +
    "GROUP BY user_id) as messages_received_daily";

var query =
    "SELECT " +
        "IFNULL(sent.sender_id, received.recipient_id) as user_id, " +
        "IFNULL(sent, 0) as sent," +
        "IFNULL(sent_daily, 0) as sent_daily, " +
        "IFNULL(sent_24, 0) as sent_24, " +
        "IFNULL(received, 0) as received, " +
        "IFNULL(received_daily, 0) as received_daily, " +
        "IFNULL(received_24, 0) as received_24, " +
        "IFNULL(sent, 0) + IFNULL(received, 0) as total, " +
        "IFNULL(sent_daily, 0) + IFNULL(received_daily, 0) as total_daily " +
    "FROM (" + received + " " +
        "LEFT JOIN " + sent + " ON received.recipient_id = sent.sender_id " +
        "LEFT JOIN " + daily_sent + " ON messages_sent_daily.user_id = received.recipient_id " +
        "LEFT JOIN " + daily_received + " ON messages_received_daily.user_id = received.recipient_id " +
        "LEFT JOIN " + received_24 + " ON messages_received_24.recipient_id = received.recipient_id " +
        "LEFT JOIN " + sent_24 + " ON messages_sent_24.sender_id = received.recipient_id) " +
    "ORDER BY -total";

var association_types = [
    "follow", "subscribe"
];

module.exports.init = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    knex = connect();

    knex.schema.hasTable('messages')
        .then(function (message) {
            init = true;
            return callback(null, knex);
        })
        .catch(function(error) {
            return callback(error);
        });
};

module.exports.database = function () {
    return init ? knex : null;
};

function connect () {

    var config = {
        user:     process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DATABASE,
        charset : 'utf8mb4'
    };

    if (process.env.INSTANCE_CONNECTION_NAME && process.env.NODE_ENV === 'production') {
        if (process.env.SQL_CLIENT === 'mysql') {
            config.socketPath = "/cloudsql/" + process.env.INSTANCE_CONNECTION_NAME;
        } else if (process.env.SQL_CLIENT === 'pg') {
            config.host = "/cloudsql/" + process.env.INSTANCE_CONNECTION_NAME;
        }
    }

    // Connect to the database
    return Knex({
        client: process.env.SQL_CLIENT,
        connection: config,
        acquireConnectionTimeout: 5*60*1000
    });
}

// Contact Methods
module.exports.define_contacts_schema = function (table) {
    // User Id
    table.string("user_id").notNullable();

    // Contact Data
    table.string("contact_id").notNullable();

    // Timestamps
    table.timestamps(true, true);
};

module.exports.add_contact            = function(user_id, contact_id, callback) {

    if(!user_id || !contact_id)
        return callback(Errors.MISSING_FIELDS());

    callback = (typeof callback === 'function') ? callback : function() {};

    knex("contacts")
        .where({
            user_id:    user_id,
            contact_id: contact_id
        })
        .then(function (response) {
            if(response.length !== 0)
                return callback(Errors.DUPLICATE_ENTRY());

            knex("contacts")
                .insert({
                    user_id:    user_id,
                    contact_id: contact_id
                })
                .then(function () {
                    return callback(null);
                });
        });
};

module.exports.remove_contact         = function(user_id, contact_id, callback) {
    if(!user_id || !contact_id)
        return callback(Errors.MISSING_FIELDS());

    callback = (typeof callback === 'function') ? callback : function() {};

    knex("contacts")
        .where({
            user_id:    user_id,
            contact_id: contact_id
        })
        .then(function (response) {
            if(response.length === 0)
                return callback(Errors.RESOURCE_NOT_FOUND());

            knex("contacts")
                .where({
                    user_id:    user_id,
                    contact_id: contact_id
                })
                .del()
                .then(function () {
                    return callback(null);
                });
        });
};

module.exports.get_contacts           = function(user_id, callback) {
    if(!user_id)
        return callback(Errors.MISSING_FIELDS());

    callback = (typeof callback === 'function') ? callback : function() {};

    knex("contacts")
        .select("contact_id")
        .where({
            user_id: user_id
        })
        .then(function (response) {
            return callback(null, response);
        });
};

module.exports.contacts_stats           = function(callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    knex.raw("SELECT user_id, COUNT(contact_id) as count FROM contacts GROUP BY user_id")
        .then(function (res) {
            var stats = res[0];
            var populated_stats = {};

            if(stats.length === 0)
                return callback(null, null);

            async.each(stats, function (stat, done) {

                var user_id = stat.user_id;

                async.parallel({
                    user: function (cb) {
                        Users.child(user_id).once("value", function (user) {
                            cb(null, user.val());
                        })
                    }
                }, function (err, results) {

                    stat.user  = results.user;

                    populated_stats[user_id] = stat;

                    done(err);
                });

            }, function (err) {
                callback(err, populated_stats);
            });
        });
};
// END

// Group Methods
module.exports.define_group_schema         = function (table) {
    // Group Id
    table.string("group_id").notNullable().primary();

    // Group Data
    table.string("name").notNullable();
    table.string("photo_url").notNullable();

    // Timestamps
    table.timestamps(true, true);

    // Unique Group Id
    table.unique(["group_id"]);
};

module.exports.define_group_members_schema = function (table) {
    // Group Id
    table.string("group_id").notNullable();

    // Group Member Data
    table.string("user_id").notNullable();
    table.boolean("admin").nullable().defaultTo(false);

    // Timestamps
    table.timestamps(true, true);
};

module.exports.add_group                   = function(group_id, name, photo_url, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!group_id || !name || !photo_url)
        return callback(Errors.MISSING_FIELDS());

    knex("groups")
        .where({
            group_id:  group_id
        })
        .then(function (response) {
            if(response.length !== 0)
                return callback(Errors.DUPLICATE_ENTRY());

            knex("groups")
                .insert({
                    group_id:  group_id,
                    name:      name,
                    photo_url: photo_url
                })
                .then(function () {
                    return callback(null);
                });
        });
};

module.exports.remove_group                = function(group_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!group_id)
        return callback(Errors.MISSING_FIELDS());

    knex("groups")
        .where({
            group_id:    group_id
        })
        .then(function (response) {
            if(response.length === 0)
                return callback(Errors.GROUP_NOT_FOUND());

            async.parallel({
                delete_group: function (cb) {
                    knex("groups")
                        .where({
                            group_id:    group_id
                        })
                        .del()
                        .then(function () {
                            cb(null);
                        })
                },
                delete_group_members: function (cb) {
                    knex("group_members")
                        .where({
                            group_id:    group_id
                        })
                        .del()
                        .then(function () {
                            cb(null);
                        });
                }
            }, function (err) {
                return callback(err);
            });
        });
};

module.exports.edit_group                  = function(group_id, updates, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!group_id || !updates)
        return callback(Errors.MISSING_FIELDS());

    var name       = updates.name      || undefined;
    var photo_url  = updates.photo_url || undefined;
    var updated_at = new Date();

    knex("groups")
        .where({
            group_id:  group_id
        })
        .then(function (response) {
            if(response.length === 0)
                return callback(Errors.GROUP_NOT_FOUND());

            knex("groups")
                .where({
                    group_id:  group_id
                })
                .update({
                    name:       name,
                    photo_url:  photo_url,
                    updated_at: updated_at
                })
                .then(function () {
                    return callback(null);
                });
        });
};

module.exports.get_group                   = get_group;

function get_group (group_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!group_id)
        return callback(Errors.MISSING_FIELDS());

    callback = (typeof callback === 'function') ? callback : function() {};

    knex("groups")
        .where({
            group_id: group_id
        })
        .then(function (response) {

            if(response.length === 0)
                return callback(Errors.GROUP_NOT_FOUND());

            return callback(null, response);
        });
}

module.exports.add_group_member            = function(group_id, user_id, admin, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!group_id || !user_id || admin === undefined)
        return callback(Errors.MISSING_FIELDS());

    knex("group_members")
        .where({
            group_id: group_id,
            user_id:  user_id,
            admin:    admin
        })
        .then(function (response) {
            if(response.length !== 0)
                return callback(Errors.DUPLICATE_ENTRY());

            get_group(group_id, function (err, response) {
                if(err)
                    return callback(err);

                if(response.length === 0)
                    return callback(Errors.GROUP_NOT_FOUND());

                knex("group_members")
                    .insert({
                        group_id: group_id,
                        user_id:  user_id,
                        admin:    admin
                    })
                    .then(function () {
                        return callback(null);
                    });
            });
        });
};

module.exports.remove_group_member         = function(group_id, user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!group_id || !user_id)
        return callback(Errors.MISSING_FIELDS());

    knex("group_members")
        .where({
            group_id: group_id,
            user_id:  user_id
        })
        .then(function (response) {
            if(response.length === 0)
                return callback(Errors.RESOURCE_NOT_FOUND());

            get_group(group_id, function (err, response) {
                if(err)
                    return callback(err);

                if(response.length === 0)
                    return callback(Errors.GROUP_NOT_FOUND());

                knex("group_members")
                    .where({
                        group_id: group_id,
                        user_id:  user_id
                    })
                    .del()
                    .then(function () {
                        return callback(null);
                    });
            });
        });
};

module.exports.get_group_members           = function(group_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!group_id)
        return callback(Errors.MISSING_FIELDS());

    callback = (typeof callback === 'function') ? callback : function() {};

    get_group(group_id, function (err, response) {
        if(err)
            return callback(err);

        if(response.length === 0)
            return callback(Errors.GROUP_NOT_FOUND());

        knex("group_members")
            .select("user_id", "admin")
            .where({
                group_id: group_id
            })
            .then(function (response) {
                return callback(null, response);
            });
    });
};

module.exports.get_user_groups             = function(user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id)
        return callback(Errors.MISSING_FIELDS());

    callback = (typeof callback === 'function') ? callback : function() {};

    knex("group_members")
        .select("*")
        .where({
            user_id: user_id
        })
        .then(function (response) {
            return callback(null, response);
        });
};
// END

// Token Methods
module.exports.define_token_schema = function (table) {
    // User Id
    table.string("user_id").notNullable();

    // Token Data
    table.string("service").notNullable();
    table.string("environment").notNullable();
    table.string("token").notNullable();

    // Timestamps
    table.timestamps(true, true);
};

module.exports.add_token           = function(user_id, service, environment, token, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id || !service || !environment || !token)
        return callback(Errors.MISSING_FIELDS());

    if(environment !== "production" && environment !== "development")
        return callback(Errors.INVALID_FIELD_TYPE());

    knex("tokens")
        .where({
            user_id:     user_id,
            service:     service,
            environment: environment,
            token:       token
        })
        .then(function (response) {
            if(response.length !== 0)
                return callback(Errors.DUPLICATE_ENTRY());

            knex("tokens")
                .insert({
                    user_id:     user_id,
                    service:     service,
                    environment: environment,
                    token:       token
                })
                .then(function () {
                    return callback(null);
                });
        });
};

module.exports.remove_token        = function(user_id, service, environment, token, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id || !service || !environment || !token)
        return callback(Errors.MISSING_FIELDS());

    if(environment !== "production" && environment !== "development")
        return callback(Errors.INVALID_FIELD_TYPE());

    knex("tokens")
        .where({
            user_id:     user_id,
            service:     service,
            environment: environment,
            token:       token
        })
        .then(function (response) {
            if(response.length === 0)
                return callback(Errors.RESOURCE_NOT_FOUND());

            knex("tokens")
                .where({
                    user_id:     user_id,
                    service:     service,
                    environment: environment,
                    token:       token
                })
                .del()
                .then(function () {
                    return callback(null);
                });
        });
};

module.exports.remove_tokens        = function(user_id, service, environment, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id || !service || !environment)
        return callback(Errors.MISSING_FIELDS());

    if(environment !== "production" && environment !== "development")
        return callback(Errors.INVALID_FIELD_TYPE());

    knex("tokens")
        .where({
            user_id:     user_id,
            service:     service,
            environment: environment
        })
        .del()
        .then(function () {
            return callback(null);
        });
};

module.exports.get_tokens          = function(user_id, service, environment, callback) {

    if(!user_id || !service || !environment)
        return callback(Errors.MISSING_FIELDS());

    knex("tokens")
        .select("token")
        .where({
            user_id:     user_id,
            service:     service,
            environment: environment
        })
        .then(function (response) {
            callback(null, response);
        });
};

module.exports.get_token_info      = function(token, callback) {

    if(!token)
        return callback(Errors.MISSING_FIELDS());

    knex("tokens")
        .select("*")
        .where({
            token: token
        })
        .then(function (response) {
            if(response.length === 0)
                return callback(null, null);

            return callback(null, response[0]);
        });
};
// END

// Message Methods
module.exports.define_message_schema = function (table) {
    // Message Id
    table.string("message_id").notNullable().primary();

    // Video Data
    table.string("mov_url").nullable().defaultTo(null);
    table.string("photo_url").nullable().defaultTo(null);
    table.string("video_url").nullable().defaultTo(null);

    // Message Details
    table.dateTime("created_at").notNullable();
    table.string("origin").notNullable();
    table.string("recipient_id").notNullable();
    table.string("sender_id").notNullable();

    // Message Manipulation
    table.json("watched").nullable().defaultTo(null);
    table.json("delivered").nullable().defaultTo(null);

    // Speech to Text
    table.string("speech_text").nullable().defaultTo(null);
    table.json("nlp").nullable().defaultTo(null);

    // Metadata
    table.json("sender_metadata").notNullable();
    table.json("group_metadata").nullable().defaultTo(null);
    table.json("recipient_metadata").nullable().defaultTo(null);

    // Unique
    table.unique(["message_id"]);
};

module.exports.push_message          = function (message, callback) {

    if(!init)
        return callback(new Error("MySQL not initialized"));

    callback = (typeof callback === 'function') ? callback : function() {};

    message  = convert_message(message);

    if(!valid_message(message)) {
        return callback(new Error("Invalid Message"));
    }

    message = stringify_JSON(message);

    if(!message.photo_url && !message.mov_url)
        return callback(Errors.MISSING_FIELDS());

    message.created_at = safe_date(message.created_at);

    knex('messages').insert(message).then(function () {
        return callback(null, message);
    }).catch(function (err) {
        return callback(err);
    });

};

module.exports.sample_message        = function () {
    return {
        message_id: Math.random().toString(),
        mov_url: "nowhere.com",
        created_at: 124,
        origin: "minimum-nodejs",
        recipient_id: "20",
        sender_id: "64",
        sender_metadata: {
            "name": "Eke Wokocha",
            "company": "Minimum, Inc.",
            "photo_url": "nowhere.com"
        }
    }
};

module.exports.message_stats         = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    knex.raw(query).then(function (res) {
        var stats = res[0];
        var populated_stats = {};

        async.each(stats, function (stat, done) {

            var user_id = stat.user_id;

            async.parallel({
                user: function (cb) {
                    // Check if user
                    Users.child(user_id).once("value", function (user) {
                        cb(null, user.val());
                    })
                },
                group: function (cb) {
                    // Check if group
                    Groups.populate_group_sql(user_id, function (err, group) {
                        cb(null, group);
                    });
                }
            }, function (err, results) {

                stat.user  = results.user;
                stat.group = results.group;

                populated_stats[user_id] = stat;

                done(err);
            });

        }, function (err) {
            callback(err, populated_stats);
        });
    });
};

module.exports.message_stats_single         = function (user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    knex.raw("" +
        "SELECT " +
            "total_messages.*, IFNULL(daily.day, 0) as past_24_hour " +
        "FROM " +
                "((" +
                "SELECT " +
                    "sender_id as user_id, COUNT(message_id) as total " +
                "FROM " +
                    "messages " +
                "WHERE " +
                    "recipient_id='"+user_id+"' " +
                "GROUP BY " +
                    "sender_id) as total_messages " +
            "LEFT JOIN " +
                "(" +
                "SELECT " +
                    "sender_id as user_id, COUNT(message_id) as day " +
                "FROM " +
                    "messages " +
                "WHERE " +
                    "recipient_id='"+user_id+"' " +
                "AND " +
                    "created_at >= DATE_ADD(CURDATE(), INTERVAL -1 DAY) " +
                "GROUP BY " +
                    "sender_id) as daily " +
                "ON " +
                    "total_messages.user_id = daily.user_id)").then(function (res) {

        var stats = res[0];
        var populated_stats = {};

        if(stats.length === 0)
            return callback(null, null);

        async.each(stats, function (stat, done) {

            var user_id = stat.user_id;

            async.parallel({
                user: function (cb) {
                    Users.child(user_id).once("value", function (user) {
                        cb(null, user.val());
                    })
                }
            }, function (err, results) {

                stat.user  = results.user;

                populated_stats[user_id] = stat;

                done(err);
            });

        }, function (err) {
            callback(err, populated_stats);
        });
    });
};

module.exports.message_count         = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    knex.raw("SELECT COUNT(message_id) as count FROM messages").then(function (res) {
        callback(null, res[0][0].count);
    });
};

module.exports.single_message         = function (messages_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!messages_id)
        return callback(Errors.MISSING_FIELDS());

    knex.raw("SELECT * FROM messages WHERE message_id='"+messages_id+"'").then(function (res) {
        if(res.length === 0 || res[0].length === 0)
            return callback(null, null);

        return callback(null, _JSON(res[0][0]));
    });
};

module.exports.define_watched_schema         = function (table) {
    // Messages Id
    table.string("message_id").notNullable();

    // Watched Data
    table.string("user_id").notNullable();
    table.string("origin").notNullable();
    table.dateTime("time").notNullable();
};

module.exports.watch_message         = function (message_id, watched, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(Errors.DATABASE_NOT_INITIALIZED());

    if(!message_id || !watched)
        return callback(Errors.MISSING_FIELDS());

    knex("messages").where({message_id: message_id}).select("watched").then(function (res) {
        if(!res || !res[0])
            return callback(Errors.RESOURCE_NOT_FOUND());

        var message = res[0],
            current_watched = JSON.parse(message.watched) || {},
            new_watched = JSON.stringify(_.merge(current_watched, watched));

        knex("messages")
            .where({message_id: message_id})
            .update({
                watched: new_watched
            })
            .then(function () {
                callback(null);
            });

        // TODO Only Table Method
        try {
            var user_id = _.keys(watched) ? _.keys(watched)[0] : null;

            if(user_id && watched[user_id]) {
                knex("watched").where({
                    message_id: message_id,
                    user_id:    user_id,
                    origin:     watched[user_id].origin
                }).select("message_id").then(function (res) {
                    if(!res.length){
                        var time = new Date(watched[user_id].time);
                        knex('watched').insert({
                            message_id: message_id,
                            user_id:    user_id,
                            origin:     watched[user_id].origin,
                            time:       time
                        }).catch(function (err) {
                            winston.error(err);
                        });
                    }
                });
            }
        } catch (e) {
            winston.error(e);
        }

    });
};

module.exports.deliver_message         = function (message_id, delivered, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(Errors.DATABASE_NOT_INITIALIZED());

    if(!message_id || !delivered)
        return callback(Errors.MISSING_FIELDS());

    knex("messages").where({message_id: message_id}).select("delivered").then(function (res) {
        if(!res || !res[0])
            return callback(Errors.RESOURCE_NOT_FOUND());

        var message = res[0],
            current_delivered = JSON.parse(message.delivered) || {},
            new_delivered     = JSON.stringify(_.merge(current_delivered, delivered));

        knex("messages")
            .where({message_id: message_id})
            .update({
                delivered: new_delivered
            })
            .then(function () {
                callback(null);
            });
    });
};

function convert_message(message) {
    if(message && message.val && message.key) {

        var hashtags = null;

        try {
            hashtags = get_hashtags(message);
        } catch (e) {
            winston.error(e);
        }

        var key            = message.key;
        message            = message.val();
        message.message_id = key;

        try {
            if(hashtags && hashtags.length !== 0){
                message["nlp"] = {};
                message["nlp"]["hashtags"] = hashtags;
            }
        } catch (e) {
            winston.error(e);
        }

        var extra_keys = _.difference(_.keys(message), _.concat(required_message_keys, optional_message_keys));

        return _.omit(message, extra_keys);

    } else return message;
}

function parse_JSON(message) {
    if(!message)
        return null;

    message.watched            = parse_or_null(message.watched);
    message.delivered          = parse_or_null(message.delivered);
    message.nlp                = parse_or_null(message.nlp);
    message.sender_metadata    = parse_or_null(message.sender_metadata);
    message.group_metadata     = parse_or_null(message.group_metadata);
    message.recipient_metadata = parse_or_null(message.recipient_metadata);

    message.created_at = new Date(message.created_at).getTime();

    delete message["group_id"];
    delete message["true_sender_id"];
    delete message["true_user_id"];
    delete message["watched_message"];
    delete message["user_id"];

    return message;
}

function stringify_JSON(message) {
    if(!message)
        return null;

    message.sender_metadata    = typeof message.sender_metadata    === "string" ? message.sender_metadata    : JSON.stringify(message.sender_metadata);
    message.group_metadata     = typeof message.group_metadata     === "string" ? message.group_metadata     : JSON.stringify(message.group_metadata);
    message.recipient_metadata = typeof message.recipient_metadata === "string" ? message.recipient_metadata : JSON.stringify(message.recipient_metadata);
    message.nlp                = typeof message.nlp                === "string" ? message.nlp                : JSON.stringify(message.nlp);
    message.watched            = typeof message.watched            === "string" ? message.watched            : JSON.stringify(message.watched);
    message.delivered          = typeof message.delivered          === "string" ? message.delivered          : JSON.stringify(message.delivered);

    message.created_at         = parseInt(message.created_at);

    return message;
}

function valid_message(message) {

    if(!message) return false;

    var keys = _.keys(message);
    var extra_keys = _.difference(keys, required_message_keys);

    return _.intersection(extra_keys, required_message_keys).length === 0;
}
// END

// Conversations Methods
module.exports.all_conversations = function (recipient_id, limit, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};
    limit    = limit || 4;

    if(!init)
        return callback(new Error("MySQL not initialized"));

    knex
        .raw(
            "SELECT messages.*, user_groups.group_id, NULL as true_sender_id " +
            "FROM " +
                "(SELECT group_id " +
                    "FROM group_members " +
                    "WHERE user_id='"+recipient_id+"') " +
                    "as user_groups " +
                "LEFT JOIN " +
                    "messages " +
                "ON user_groups.group_id = messages.recipient_id " +
                "WHERE created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY) " +
            "UNION " +
                "SELECT *, NULL as group_id, sender_id as true_sender_id " +
                "FROM messages " +
                    "WHERE " +
                        "recipient_id='"+recipient_id+"' " +
                        "AND created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY) " +
            "UNION " +
                "SELECT *, recipient_id as true_sender_id, NULL as group_id " +
                "FROM messages " +
                    "WHERE " +
                        "sender_id='"+recipient_id+"' " +
                        "AND created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY)")
        .then(function (res) {

            if(!res || !res[0])
                return callback(null);

            var messages = res[0],
                populated_messages = {};

            async.each(messages, function (message, cb) {
                populated_messages[message.group_id || message.true_sender_id] = populated_messages[message.group_id || message.true_sender_id] || {};
                populated_messages[message.group_id || message.true_sender_id][message.message_id] = parse_JSON(message);
                cb(null);
            }, function (err) {
                if(err)
                    return callback(err);

                callback(null, populated_messages);
            });
        });
};

module.exports.all_received_conversations = function (recipient_id, limit, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};
    limit    = limit || 4;

    if(!init)
        return callback(new Error("MySQL not initialized"));

    knex
        .raw(
            "SELECT messages.*, user_groups.group_id, NULL as true_sender_id " +
            "FROM " +
            "(SELECT group_id " +
            "FROM group_members " +
            "WHERE user_id='"+recipient_id+"') " +
            "as user_groups " +
            "LEFT JOIN " +
            "messages " +
            "ON user_groups.group_id = messages.recipient_id " +
            "WHERE created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY) " +
            "AND messages.sender_id <> '"+recipient_id+"' " +
            "UNION " +
            "SELECT *, NULL as group_id, sender_id as true_sender_id " +
            "FROM messages " +
            "WHERE " +
            "recipient_id='"+recipient_id+"' " +
            "AND created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY)")
        .then(function (res) {

            if(!res || !res[0])
                return callback(null);

            var messages = res[0],
                populated_messages = {};

            async.each(messages, function (message, cb) {
                populated_messages[message.group_id || message.true_sender_id] = populated_messages[message.group_id || message.true_sender_id] || {};
                populated_messages[message.group_id || message.true_sender_id][message.message_id] = parse_JSON(message);
                cb(null);
            }, function (err) {
                if(err)
                    return callback(err);

                callback(null, populated_messages);
            });
        });
};

module.exports.group_conversation = function (recipient_id, limit, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};
    limit    = limit || 4;

    if(!init)
        return callback(new Error("MySQL not initialized"));

    knex
        .raw(
            "SELECT *, NULL as group_id, sender_id as true_sender_id " +
            "FROM messages " +
            "WHERE " +
            "recipient_id='"+recipient_id+"' " +
            "AND created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY)")
        .then(function (res) {

            if(!res || !res[0])
                return callback(null);

            var messages = res[0],
                populated_messages = {};

            async.each(messages, function (message, cb) {
                populated_messages[message.message_id] = parse_JSON(message);
                cb(null);
            }, function (err) {
                if(err)
                    return callback(err);

                callback(null, populated_messages);
            });
        });
};

module.exports.group_conversation_deep = function (recipient_id, limit, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};
    limit    = limit || 4;

    if(!init)
        return callback(new Error("MySQL not initialized"));

    knex
        .raw(
            "SELECT *" +
            "FROM messages " +
            "WHERE " +
            "recipient_id='"+recipient_id+"'")
        .then(function (res) {

            if(!res || !res[0])
                return callback(null);

            var messages = res[0],
                populated_messages = {};

            async.each(messages, function (message, cb) {
                var date = to_date(message.created_at);
                populated_messages[date] = populated_messages[date] || {};
                populated_messages[date][message.message_id] = parse_JSON(message);
                cb(null);
            }, function (err) {
                if(err)
                    return callback(err);

                callback(null, populated_messages);
            });
        });
};

module.exports.count_unwatched = function (recipient_id, limit, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};
    limit    = limit || 4;

    if(!init)
        return callback(new Error("MySQL not initialized"));

    knex
        .raw(
            "SELECT COUNT(filtered_messages.message_id), filtered_messages.true_user_id FROM " +
            "(SELECT unfiltered_messages.*, watched.user_id as watched_message, IFNULL(unfiltered_messages.true_sender_id, unfiltered_messages.group_id) as true_user_id FROM " +
            "(SELECT messages.message_id, '"+recipient_id+"' as user_id, user_groups.group_id, NULL as true_sender_id " +
            "FROM " +
            "(SELECT group_id " +
            "FROM group_members " +
            "WHERE user_id='"+recipient_id+"') " +
            "as user_groups " +
            "LEFT JOIN " +
            "messages " +
            "ON user_groups.group_id = messages.recipient_id " +
            "WHERE created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY) " +
            "AND sender_id <> '"+recipient_id+"' " +
            "UNION " +
            "SELECT message_id, '"+recipient_id+"' as user_id, NULL as group_id, sender_id as true_sender_id " +
            "FROM messages " +
            "WHERE " +
            "recipient_id='"+recipient_id+"' " +
            "AND sender_id <> recipient_id " +
            "AND created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY)) unfiltered_messages " +
            "LEFT JOIN watched ON (unfiltered_messages.message_id, unfiltered_messages.user_id) = (watched.message_id, watched.user_id)) filtered_messages " +
            "WHERE filtered_messages.watched_message IS NULL " +
            "GROUP BY filtered_messages.true_user_id")
        .then(function (res) {

            if(!res || !res[0])
                return callback(null, []);

            var users = res[0].map(function (p) {
                return p.true_user_id;
            });

            callback(null, users);
        });
};

module.exports.populate_unwatched = function (recipient_id, limit, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};
    limit    = limit || 4;

    if(!init)
        return callback(new Error("MySQL not initialized"));

    knex
        .raw(
            "SELECT * FROM " +
            "(SELECT unfiltered_messages.*, watched.user_id as watched_message, IFNULL(unfiltered_messages.true_sender_id, unfiltered_messages.group_id) as true_user_id FROM " +
            "(SELECT messages.*, '"+recipient_id+"' as user_id, user_groups.group_id, NULL as true_sender_id " +
            "FROM " +
            "(SELECT group_id " +
            "FROM group_members " +
            "WHERE user_id='"+recipient_id+"') " +
            "as user_groups " +
            "LEFT JOIN " +
            "messages " +
            "ON user_groups.group_id = messages.recipient_id " +
            "WHERE created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY) " +
            "AND sender_id <> '"+recipient_id+"' " +
            "UNION " +
            "SELECT *, '"+recipient_id+"' as user_id, NULL as group_id, sender_id as true_sender_id " +
            "FROM messages " +
            "WHERE " +
            "recipient_id='"+recipient_id+"' " +
            "AND sender_id <> recipient_id " +
            "AND created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY)) unfiltered_messages " +
            "LEFT JOIN watched ON (unfiltered_messages.message_id, unfiltered_messages.user_id) = (watched.message_id, watched.user_id)) filtered_messages " +
            "WHERE filtered_messages.watched_message IS NULL")
        .then(function (res) {

            if(!res || !res[0])
                return callback(null, []);

            var messages = res[0],
                populated_messages = {};

            async.each(messages, function (message, cb) {
                populated_messages[message.group_id || message.true_sender_id] = populated_messages[message.group_id || message.true_sender_id] || {};
                populated_messages[message.group_id || message.true_sender_id][message.message_id] = parse_JSON(message);
                cb(null);
            }, function (err) {
                if(err)
                    return callback(err);

                callback(null, populated_messages);
            });
        });
};

module.exports.populate_unwatched_fast = function (recipient_id, limit, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};
    limit    = limit || 4;

    if(!init)
        return callback(new Error("MySQL not initialized"));

    async.parallel({
        messages: function (cb) {
            knex
                .raw(
                    "SELECT * FROM " +
                    "(SELECT unfiltered_messages.*, IFNULL(unfiltered_messages.true_sender_id, unfiltered_messages.group_id) as true_user_id FROM " +
                    "(SELECT messages.*, '"+recipient_id+"' as user_id, user_groups.group_id, NULL as true_sender_id " +
                    "FROM " +
                    "(SELECT group_id " +
                    "FROM group_members " +
                    "WHERE user_id='"+recipient_id+"') " +
                    "as user_groups " +
                    "LEFT JOIN " +
                    "messages " +
                    "ON user_groups.group_id = messages.recipient_id " +
                    "WHERE created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY) " +
                    "AND sender_id <> '"+recipient_id+"' " +
                    "UNION " +
                    "SELECT *, '"+recipient_id+"' as user_id, NULL as group_id, sender_id as true_sender_id " +
                    "FROM messages " +
                    "WHERE " +
                    "recipient_id='"+recipient_id+"' " +
                    "AND sender_id <> recipient_id " +
                    "AND created_at >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY)) unfiltered_messages) filtered_messages")
                .then(function (res) {

                    if(!res || !res[0])
                        return cb(null, []);

                    return cb(null, res[0]);
                });
        },
        watched: function (cb) {
            knex
                .raw(
                    "SELECT message_id " +
                    "FROM watched " +
                    "WHERE user_id='"+recipient_id+"' " +
                    "AND time >= DATE_ADD(CURDATE(), INTERVAL -"+limit+" DAY) ")
                .then(function (res) {

                    if(!res || !res[0])
                        return cb(null, {});

                    var messages = res[0],
                        watched  = {};

                    async.each(messages, function (message, done) {
                        watched[message.message_id] = true;
                        done(null);
                    }, function (err) {
                        if(err)
                            return cb(err);

                        return cb(null, watched);
                    });

                });
        }
    }, function (err, results) {

        var messages = results.messages,
            watched  = results.watched,
            populated_messages = {};

        async.each(messages, function (message, cb) {
            if(watched[message.message_id])
                return cb(null);

            populated_messages[message.group_id || message.true_sender_id] = populated_messages[message.group_id || message.true_sender_id] || {};
            populated_messages[message.group_id || message.true_sender_id][message.message_id] = parse_JSON(message);

            cb(null);
        }, function (err) {
            if(err)
                return callback(err);

            callback(null, populated_messages);
        });
    });
};

module.exports.one_conversation = one_conversation;

function one_conversation (recipient_id, sender_id, limit, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    knex
        .raw("SELECT * FROM messages " +
                "WHERE recipient_id = \"" + recipient_id + "\" " +
                "AND sender_id = \"" + sender_id + "\" " +
                (limit ? "AND created_at >= DATE_ADD(CURDATE(), INTERVAL -" + limit + " DAY) " : "") +
            "UNION " +
            "SELECT * FROM messages " +
            "WHERE recipient_id = \"" + sender_id + "\" " +
            "AND sender_id = \"" + recipient_id + "\" " +
            (limit ? "AND created_at >= DATE_ADD(CURDATE(), INTERVAL -" + limit + " DAY) " : ""))
        .then(function (res) {

            if(!res || !res[0])
                return callback(null);

            var messages = res[0],
                populated_messages = {};

            async.each(messages, function (message, cb) {
                populated_messages[message.message_id] = parse_JSON(message);
                cb(null);
            }, function (err) {
                if(err)
                    return callback(err);

                callback(null, populated_messages);
            });
        });
};

module.exports.convert_to_firebase_object = function (id, object) {

    var obj = function (object_id, value) {
        this.key   = object_id;
        this.value = value
    };

    obj.prototype.val = function () {
        return this.value;
    };

    return new obj(id, object);
};

function to_date(time) {
    if(!time)
        return "01-01-01";

    var date = new Date(time);

    return ('0' + (date.getMonth()+1)).slice(-2) + '-'
         + ('0' + date.getDate()).slice(-2) + '-'
         + ('0' + date.getFullYear()).slice(-2)
}
// END


module.exports.define_muted_groups_schema         = function (table) {
    table.string("user_id").notNullable();
    table.string("group_id").notNullable();
};

module.exports.define_snooze_schema         = function (table) {
    table.string("user_id").notNullable();
    table.dateTime("active_date").nullable().defaultTo(knex.fn.now());
    table.integer("start_time").nullable().defaultTo(0);
    table.integer("end_time").nullable().defaultTo(1440);
};

module.exports.mute_group = function (user_id, group_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!user_id || !group_id)
        return callback(Errors.MISSING_FIELDS());

    var muted_group = {
        user_id:  user_id,
        group_id: group_id
    };

    knex("muted_groups")
        .where(muted_group)
        .then(function (response) {
            if(response.length !== 0)
                return callback(Errors.DUPLICATE_ENTRY());
            knex('muted_groups').insert(muted_group).then(function () {
                return callback(null, muted_group);
            }).catch(function (err) {
                return callback(err);
            });

        });
};

module.exports.unmute_group = function (user_id, group_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!user_id || !group_id)
        return callback(Errors.MISSING_FIELDS());

    var muted_group = {
        user_id:  user_id,
        group_id: group_id
    };

    knex("muted_groups")
        .where(muted_group)
        .then(function (response) {
            if(response.length === 0)
                return callback(Errors.RESOURCE_NOT_FOUND());

            knex("muted_groups")
                .where(muted_group)
                .del()
                .then(function () {
                    return callback(null);
                });
        });
};

module.exports.get_muted_groups = function (user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!user_id)
        return callback(Errors.MISSING_FIELDS());

    knex("muted_groups")
        .where({
            user_id: user_id
        })
        .then(function (response) {
            if(response.length === 0)
                return callback(null, null);

            var groups = _.map(response, function (r) {
                return r.group_id;
            });

            return callback(null, groups);
        });
};

module.exports.get_muted_users = function (group_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!group_id)
        return callback(Errors.MISSING_FIELDS());

    knex("muted_groups")
        .where({
            group_id: group_id
        })
        .then(function (response) {
            if(response.length === 0)
                return callback(null, null);

            var users = _.map(response, function (r) {
                return r.user_id;
            });

            return callback(null, users);
        });
};

module.exports.set_snooze_hours = function (user_id, start_time, end_time, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!user_id || !start_time || !end_time)
        return callback(Errors.MISSING_FIELDS());

    knex("snooze")
        .where({
            user_id: user_id
        })
        .then(function (response) {

            var settings = {
                user_id: user_id
            };

            settings.start_time = parseInt(start_time);
            settings.end_time   = parseInt(end_time);

            if(response.length !== 0) {
                knex("snooze")
                    .where({
                        user_id:  user_id
                    })
                    .update(settings)
                    .then(function () {
                        return callback(null, settings);
                    }).catch(function (err) {
                        return callback(err);
                    });
            } else {
                knex('snooze').insert(settings).then(function () {
                    return callback(null, settings);
                }).catch(function (err) {
                    return callback(err);
                });
            }


        });
};

module.exports.snooze = function (user_id, active_date, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!user_id || !active_date)
        return callback(Errors.MISSING_FIELDS());

    knex("snooze")
        .where({
            user_id: user_id
        })
        .then(function (response) {

            var settings = {
                user_id: user_id
            };

            settings.active_date = new Date(parseInt(active_date));

            if(response.length !== 0) {
                knex("snooze")
                    .where({
                        user_id:  user_id
                    })
                    .update(settings)
                    .then(function () {
                        return callback(null, settings);
                    });
            } else {
                knex('snooze').insert(settings).then(function () {
                    return callback(null, settings);
                }).catch(function (err) {
                    return callback(err);
                });
            }
        });
};


module.exports.get_snooze_hours = function (user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!user_id)
        return callback(Errors.MISSING_FIELDS());

    knex("snooze")
        .where({
            user_id: user_id
        })
        .then(function (response) {

            var settings = response.length !== 0 ? response[0] : {
                user_id: user_id
            };

            settings.active_date = settings.active_date ?
                new Date(settings.active_date).getTime() :
                new Date().getTime() - 1000*60*60;

            settings.start_time = settings.start_time || 0;
            settings.end_time   = settings.end_time   || 1440;

            settings.start_time = settings.start_time < 0    ? 0    : settings.start_time;
            settings.end_time   = settings.end_time   > 1440 ? 1440 : settings.end_time;

            return callback(null, settings);
        });
};


module.exports.define_story_schema = function (table) {
    // User Id
    table.string("user_id").notNullable();

    // Contact Data
    table.string("message_id").notNullable();

    // Company Id
    table.string("company_id").nullable();


    // Timestamps
    table.timestamps(true, true);
};

module.exports.add_story                   = function(user_id, message_id, company_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id || !message_id || !company_id)
        return callback(Errors.MISSING_FIELDS());

    knex("stories")
        .where({
            user_id:    user_id,
            message_id: message_id
        })
        .then(function (response) {
            if(response.length !== 0)
                return callback(Errors.DUPLICATE_ENTRY());

            knex("stories")
                .insert({
                    user_id:    user_id,
                    message_id: message_id,
                    company_id: company_id
                })
                .then(function () {
                    return callback(null);
                });
        });
};

module.exports.add_company_id                   = function(user_id, company_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id || !company_id)
        return callback(Errors.MISSING_FIELDS());

    knex("stories")
        .where({
            user_id:  user_id
        })
        .update({
            company_id: company_id
        })
        .then(function () {
            return callback(null);
        });
};

module.exports.get_stories                   = function(user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    async.parallel({
        stories: function (done) {
            knex
                .raw("SELECT messages.* FROM stories LEFT JOIN messages ON stories.message_id=messages.message_id " +
                    "WHERE stories.created_at >= DATE_ADD(CURDATE(), INTERVAL -7 DAY) ")
                .then(function (response) {
                    if (response.length === 0)
                        return callback(null, null);

                    var messages = response[0],
                        populated_messages = {};

                    async.each(messages, function (message, cb) {
                        populated_messages[message.sender_id] = populated_messages[message.sender_id] || {};
                        populated_messages[message.sender_id][message.message_id] = parse_JSON(message);
                        return cb(null);
                    }, function (err) {
                        if (err)
                            return done(err);

                        return done(null, populated_messages);
                    });
                });
        },
        welcome: function (done) {

            var story_id = "story-@" + user_id;

            knex
                .raw("SELECT * FROM messages " +
                    "WHERE created_at >= DATE_ADD(CURDATE(), INTERVAL -1000 DAY) " +
                    "AND " +
                    "recipient_id = '" + story_id + "'")
                .then(function (response) {
                    if (response.length === 0)
                        return callback(null, null);

                    var messages = response[0],
                        populated_messages = {};

                    async.each(messages, function (message, cb) {
                        populated_messages[message.sender_id] = populated_messages[message.sender_id] || {};
                        populated_messages[message.sender_id][message.message_id] = parse_JSON(message);
                        return cb(null);
                    }, function (err) {
                        if (err)
                            return done(err);

                        return done(null, populated_messages);
                    });
                });
        }
    }, function (err, results) {

        var final_messages = _.merge(results.stories, results.welcome);

        callback(err, final_messages);
    });


};

module.exports.get_company_stories                   = function(user_id, company_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    async.parallel({
        stories: function (done) {
            knex
                .raw("SELECT messages.* FROM stories LEFT JOIN messages ON stories.message_id=messages.message_id " +
                    "WHERE stories.created_at >= DATE_ADD(CURDATE(), INTERVAL -7 DAY) " +
                    "AND company_id='" + company_id + "'")
                .then(function (response) {
                    if(response.length === 0)
                        return callback(null, null);

                    var messages = response[0],
                        populated_messages = {};

                    async.each(messages, function (message, cb) {
                        populated_messages[message.sender_id] = populated_messages[message.sender_id] || {};
                        populated_messages[message.sender_id][message.message_id] = parse_JSON(message);
                        cb(null);
                    }, function (err) {
                        if(err)
                            return done(err);

                        done(null, populated_messages);
                    });
                });
        },
        welcome: function (done) {
            var story_id = "story-@" + user_id;

            knex
                .raw("SELECT * FROM messages " +
                    "WHERE created_at >= DATE_ADD(CURDATE(), INTERVAL -1000 DAY) " +
                    "AND " +
                    "recipient_id = '" + story_id + "'")
                .then(function (response) {
                    if (response.length === 0)
                        return callback(null, null);

                    var messages = response[0],
                        populated_messages = {};

                    async.each(messages, function (message, cb) {
                        populated_messages[message.sender_id] = populated_messages[message.sender_id] || {};
                        populated_messages[message.sender_id][message.message_id] = parse_JSON(message);
                        return cb(null);
                    }, function (err) {
                        if (err)
                            return done(err);

                        return done(null, populated_messages);
                    });
                });
        }
    }, function (err, results) {

        var final_messages = _.merge(results.stories, results.welcome);

        callback(err, final_messages);

    });


};


module.exports.define_associations_schema         = function (table) {
    table.string("associater_id").notNullable();
    table.string("associatee_id").notNullable();

    table.timestamps(true, true);

    table.string("type").notNullable();
    table.decimal("cost").nullable().defaultTo(0);
};

module.exports.define_association_request_schema         = function (table) {
    table.string("associater_id").notNullable();
    table.string("associatee_id").notNullable();

    table.timestamps(true, true);

    table.string("type").notNullable();
    table.decimal("cost").nullable().defaultTo(0);

    table.boolean("archived").nullable().defaultTo(false);

};

module.exports.add_association_request = function (associater_id, associatee_id, type, cost, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!associater_id || !associatee_id || !type)
        return callback(Errors.MISSING_FIELDS());

    type = type.toLowerCase().trim();

    if(association_types.indexOf(type) === -1)
        return callback(Errors.INVALID_FIELD_TYPE());

    cost = cost || 0;

    var association_request = {
        associater_id: associater_id,
        associatee_id: associatee_id,
        type:          type,
        cost:          cost
    };

    knex("association_requests")
        .where(association_request)
        .then(function (response) {

            if(response.length !== 0)
                return callback(Errors.DUPLICATE_ENTRY());

            knex('association_requests').insert(association_request).then(function () {
                return callback(null, association_request);
            }).catch(function (err) {
                return callback(err);
            });

        });
};

module.exports.deny_association_request = function (associater_id, associatee_id, type, cost, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!associater_id || !associatee_id || !type)
        return callback(Errors.MISSING_FIELDS());

    type = type.toLowerCase();

    if(association_types.indexOf(type) === -1)
        return callback(Errors.INVALID_FIELD_TYPE());

    cost = cost || 0;

    var association_request = {
        associater_id: associater_id,
        associatee_id: associatee_id,
        type:          type,
        cost:          cost
    };

    knex("association_requests")
        .where(association_request)
        .then(function (response) {

            if(response.length === 0)
                return callback(Errors.RESOURCE_NOT_FOUND());

            knex('association_requests').where(association_request).update({archived: true}).then(function () {
                return callback(null, association_request);
            }).catch(function (err) {
                return callback(err);
            });

        });
};

module.exports.remove_association_request = function (associater_id, associatee_id, type, cost, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!associater_id || !associatee_id || !type)
        return callback(Errors.MISSING_FIELDS());

    type = type.toLowerCase();

    if(association_types.indexOf(type) === -1)
        return callback(Errors.INVALID_FIELD_TYPE());

    cost = cost || 0;

    var association_request = {
        associater_id: associater_id,
        associatee_id: associatee_id,
        type:          type,
        cost:          cost
    };

    knex("association_requests")
        .where(association_request)
        .then(function (response) {

            if(response.length === 0)
                return callback(Errors.RESOURCE_NOT_FOUND());

            knex('association_requests').where(association_request).del().then(function () {
                return callback(null, association_request);
            }).catch(function (err) {
                return callback(err);
            });

        });
};

module.exports.get_association_requests = function (associatee_id, type, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!associatee_id || !type)
        return callback(Errors.MISSING_FIELDS());

    type = type.toLowerCase();

    if(association_types.indexOf(type) === -1)
        return callback(Errors.INVALID_FIELD_TYPE());

    var association_request = {
        associatee_id: associatee_id,
        type:          type,
        archived:      false
    };

    knex("association_requests")
        .where(association_request)
        .then(function (response) {

            async.map(response, function (association_request, cb) {
                Users.child(association_request.associater_id).once("value", function (user) {

                    association_request.associater_metadata = filter_user(user.val());
                    association_request.created_at          = new Date(association_request.created_at).getTime();
                    association_request.updated_at          = new Date(association_request.updated_at).getTime();

                    return cb(null, association_request);
                });
            }, function (err, populated_association_requests) {
                return callback(null, populated_association_requests);

            });

        });
};

module.exports.add_association = function (associater_id, associatee_id, type, cost, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!associater_id || !associatee_id || !type)
        return callback(Errors.MISSING_FIELDS());

    type = type.toLowerCase();

    if(association_types.indexOf(type) === -1)
        return callback(Errors.INVALID_FIELD_TYPE());

    cost = cost || 0;

    var association = {
        associater_id: associater_id,
        associatee_id: associatee_id,
        type:          type,
        cost:          cost
    };

    knex("associations")
        .where(association)
        .then(function (response) {

            if(response.length !== 0)
                return callback(Errors.DUPLICATE_ENTRY());

            knex('associations').insert(association).then(function () {
                return callback(null, association);
            }).catch(function (err) {
                return callback(err);
            });

        });
};

module.exports.get_associations_received = function (associatee_id, type, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!associatee_id || !type)
        return callback(Errors.MISSING_FIELDS());

    type = type.toLowerCase();

    if(association_types.indexOf(type) === -1)
        return callback(Errors.INVALID_FIELD_TYPE());

    var association = {
        associatee_id: associatee_id,
        type:          type
    };

    knex("associations")
        .where(association)
        .then(function (response) {

            async.map(response, function (association, cb) {
                Users.child(association.associater_id).once("value", function (user) {

                    association.associater_metadata = filter_user(user.val());
                    association.created_at          = new Date(association.created_at).getTime();
                    association.updated_at          = new Date(association.updated_at).getTime();

                    return cb(null, association);
                });
            }, function (err, populated_associations) {
                return callback(null, populated_associations);

            });

        });
};

module.exports.get_associations_sent = function (associater_id, type, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!associater_id || !type)
        return callback(Errors.MISSING_FIELDS());

    type = type.toLowerCase();

    if(association_types.indexOf(type) === -1)
        return callback(Errors.INVALID_FIELD_TYPE());

    var association = {
        associater_id: associater_id,
        type:          type
    };

    knex("associations")
        .where(association)
        .then(function (response) {

            async.map(response, function (association, cb) {
                Users.child(association.associatee_id).once("value", function (user) {

                    association.associatee_metadata = filter_user(user.val());
                    association.created_at          = new Date(association.created_at).getTime();
                    association.updated_at          = new Date(association.updated_at).getTime();

                    return cb(null, association);
                });
            }, function (err, populated_associations) {
                return callback(null, populated_associations);

            });

        });
};

module.exports.get_follow_relationship = function (user_id, other_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!user_id || !other_id)
        return callback(Errors.MISSING_FIELDS());

    var type = "FOLLOW";

    async.parallel({
        sent: function (cb) {
            var association_request = {
                associater_id: user_id,
                associatee_id: other_id,
                type:          type
            };

            knex("association_requests")
                .where(association_request)
                .then(function (response) {
                    return cb(null, response.length === 0 ? "" : "SENT");
                });

        },
        following: function (cb) {
            var association = {
                associater_id: user_id,
                associatee_id: other_id,
                type:          type
            };

            knex("associations")
                .where(association)
                .then(function (response) {
                    return cb(null, response.length === 0 ? "" : "FOLLOWING");
                });
        },
        follower: function (cb) {
            var association = {
                associater_id: other_id,
                associatee_id: user_id,
                type:          type
            };

            knex("associations")
                .where(association)
                .then(function (response) {
                    return cb(null, response.length === 0 ? "" : "FOLLOWER");
                });
        },
        received: function (cb) {
            var association_request = {
                associater_id: other_id,
                associatee_id: user_id,
                type:          type
            };

            knex("association_requests")
                .where(association_request)
                .then(function (response) {
                    return cb(null, response.length === 0 ? "" : "RECEIVED");
                });
        }
    }, function (err, results) {

        var relationship = _.filter(_.values(results), function(o) { return o.length; }).join(",");
        relationship = (relationship.length ? relationship : "NO_ASSOCIATION") + ",DEAD";

        callback(null, relationship);
    });



};

module.exports.remove_association = function (associater_id, associatee_id, type, cost, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!init)
        return callback(new Error("MySQL not initialized"));

    if(!associater_id || !associatee_id || !type)
        return callback(Errors.MISSING_FIELDS());

    cost = cost || 0;

    var association = {
        associater_id: associater_id,
        associatee_id: associatee_id,
        type:          type,
        cost:          cost
    };

    knex("associations")
        .where(association)
        .then(function (response) {

            if(response.length === 0)
                return callback(Errors.RESOURCE_NOT_FOUND());

            knex('associations').where(association).del().then(function () {
                return callback(null, association);
            }).catch(function (err) {
                return callback(err);
            });

        });
};

module.exports.set_character_set = function () {
    knex.raw("SET NAMES utf8mb4").then(function () {
        winston.info("MySQL NAMES Character Set");
    });
    knex.raw("ALTER DATABASE minimum CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci").then(function () {
        winston.info("MySQL Database Character Set");
    });
    knex.raw("ALTER TABLE messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci").then(function () {
        winston.info("MySQL Table Character Set");
    });
    knex.raw("ALTER TABLE stories CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci").then(function () {
        winston.info("MySQL Table Character Set");
    });
    knex.raw("ALTER TABLE messages CHANGE speech_text speech_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci").then(function () {
        winston.info("MySQL Column Character Set");
    });
};

function parse_or_null(obj) {
    try {
        return JSON.parse(obj);
    } catch (e) {
        return null;
    }
}

function get_hashtags(message) {
    var hashtags = [];

    if(!message || !message.val || !message.val() || !message.val().speech_text)
        return;

    if(message.val().keywords)
        _.each(message.val().keywords, function (key) {
            if(key.relevance > 0.8)
                hashtags.push(key.text.split(" ").join("").toLowerCase());
        });

    if(message.val().entities)
        _.each(message.val().entities, function (key) {
            if(key.type === "Person" || key.type === "Location" || key.type === "Company")
                hashtags.push(key.text.split(" ").join("").toLowerCase());
        });

    hashtags = _.uniq(hashtags);

    return hashtags;
}

function safe_date(time) {

    var now = new Date().getTime();

    var diff = Math.abs(now - time);
    var day  = 60*1000*60*24;

    if (diff > (365*day)){
        winston.error("Date too far back in the past: " + time);
        return new Date();
    }

    return new Date(time);
}

function filter_user(user) {

    if (!user)
        return user;

    delete user["password"];
    delete user["valid_token_timestamp"];
    delete user["image"];
    delete user["linkedin"];
    delete user["linkedin_id"];
    delete user["updated_at"];

    user.intro_video_url = user.intro_video_url || null;
    user.intro_mov_url   = user.intro_mov_url   || null;
    user.blurb           = user.blurb           || null;
    user.about_me        = user.about_me        || null;
    user.email           = user.email           || null;
    user.name            = user.name            || null;
    user.photo_url       = user.photo_url       || null;
    user.user_id         = user.user_id         || null;

    user.type            = user.type            || "USER";

    return user;
}