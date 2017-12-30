"use strict";

var Tokens       = require("../models/Tokens");
var MySQLService = require("../services/MySQLService");

var async = require("async");

module.exports.get_tokens = function (user_id, service, environment, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Tokens.get_tokens(user_id, service, environment, callback);
};

module.exports.add_token = function (user_id, service, environment, token, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Tokens.add_token(user_id, service, environment, token, callback);
};

module.exports.remove_token = function (user_id, service, environment, token, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Tokens.remove_token(user_id, service, environment, token, callback);
};

module.exports.remove_tokens = function (user_id, service, environment, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    MySQLService.remove_tokens(user_id, service, environment, callback);
};

module.exports.get_token_info = function (token, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    MySQLService.get_token_info(token, callback);
};