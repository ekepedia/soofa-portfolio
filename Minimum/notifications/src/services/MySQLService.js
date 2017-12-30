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

    message.created_at = new Date(message.created_at);

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

module.exports.get_stories                   = function(callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    knex
        .raw("SELECT messages.* FROM stories LEFT JOIN messages ON stories.message_id=messages.message_id " +
            "WHERE stories.created_at >= DATE_ADD(CURDATE(), INTERVAL -7 DAY) ")
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
                    return callback(err);

                callback(null, populated_messages);
            });
        });
};

module.exports.get_company_stories                   = function(company_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

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
                    return callback(err);

                callback(null, populated_messages);
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