"use strict";

var admin = require("firebase-admin"),
    db    = admin.database(),
    ref   = db.ref("Users"),
    _     = require("lodash");

var Users     = require("../models/Users");
var Companies = require("../models/Companies");
var Contacts  = db.ref("Contacts");

var MySQLService = require("../services/MySQLService");

module.exports.getAll = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    ref.once("value", function(data) {
        callback(null, data);
    });
};

module.exports.getOne = function (field, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    ref.child(field).once("value", function(data) {
            callback(null, data);
    });
};

 module.exports.new    = function (user, callback) {

     callback = (typeof callback === 'function') ? callback : function() {};

     Companies.one(user.company_id, function (err, company) {
         if(!company || !company.company_id)
             return callback("Company not found");

         user = _.merge(user, {
             company: company.name
         });

         Users.new(user, callback);

     });


};

module.exports.update   = function (user_id, user, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Companies.one(user.company_id, function (err, company) {

        if(!company)
            return callback("Company not found");

        user.company = company.name;

        Users.update(user_id, user, callback);

    });

};

module.exports.find_by_username   = function (username, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!username)
        return callback(new Error("Missing fields"));

    Users.find_by_username(username, function (err, user) {

        callback(err, user);

    });

};

module.exports.find_by_email   = function (email, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!email)
        return callback(new Error("Missing fields"));

    Users.find_by_email(email, function (err, user) {

        callback(err, user);

    });

};

module.exports.get_company   = function (company_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!company_id)
        return callback(new Error("Missing fields"));

    ref.orderByChild("company_id").equalTo(company_id).once("value", function (users) {
        callback(null, users);
    });

};

module.exports.edit_user   = function (user_id, updates, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Users.update(user_id, updates, callback);

};

module.exports.reset_password   = function (user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    ref.child(user_id).child("password").set(null);
    ref.child(user_id).child("valid_token_timestamp").set(null);

    return callback(null);

};