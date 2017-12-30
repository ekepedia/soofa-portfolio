"use strict";

var admin  = require("firebase-admin"),
    Tokens = admin.database().ref("Tokens");

var MySQLService = require("../services/MySQLService");

var Errors = require("../helpers/Errors");

var async = require("async");

module.exports.apn_tokens = function (id, env, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!id || !env)
        return callback(new Error("Missing fields"));

    Tokens.child(id).child("apn").child(env).once("value", function(data) {
        callback(null, data);
    });

};

module.exports.new_apn_token = function (id, token, env, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!id || !env || !token)
        return callback(new Error("Missing fields"));

    Tokens.child(id).child("apn").child(env).push(token, function (err) {
        callback(err);
    });

};

module.exports.remove_apn_token = function (id, token, env, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!id || !env || !token)
        return callback(new Error("Missing fields"));

    Tokens.child(id).child("apn").child(env).child(token).set(null);

};

module.exports.get_tokens = function (user_id, service, environment, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id || !service || !environment)
        return callback(Errors.MISSING_FIELDS());

    MySQLService.get_tokens(user_id, service, environment, function (err, tokens) {
        if(err)
            return callback(err);

        if(tokens.length === 0)
            return callback(null, null);

        async.map(tokens, function (token, cb) {
            cb(null, token.token);
        }, function (err, tokens) {
            return callback(err, tokens);
        });
    });

};

module.exports.add_token = function (user_id, service, environment, token, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id || !service || !environment || !token)
        return callback(Errors.MISSING_FIELDS());

    var env = environment === "production" ? "prod" : "dev";

    // TODO Remove Firebase Sync
    Tokens.child(user_id).child("apn").child(env).child(token).set(true);

    MySQLService.add_token(user_id, service, environment, token, function (err) {
        return callback(err);
    });
};

module.exports.remove_token = function (user_id, service, environment, token, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id || !service || !environment || !token)
        return callback(Errors.MISSING_FIELDS());

    var env = environment === "production" ? "prod" : "dev";

    // TODO Remove Firebase Sync
    Tokens.child(user_id).child("apn").child(env).child(token).set(null);

    MySQLService.remove_token(user_id, service, environment, token, function (err) {
        return callback(err);
    });
};

module.exports.reference = Tokens;