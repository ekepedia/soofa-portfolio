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

     Users.new(user, callback);

};

module.exports.update   = function (user_id, user, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Users.update(user_id, user, callback);

};

module.exports.delete_user   = function (user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Users.delete_user(user_id, callback);

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

module.exports.get_contacts   = function (user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id)
        return callback(new Error("Missing fields"));

    Users.get_contacts(user_id, function (err, contacts) {

        callback(err, contacts);

    });

};

module.exports.get_all_contacts = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Users.get_all_contacts(function (err, contacts) {

        callback(err, contacts);

    });

};

module.exports.remove_contact = function (user_id, contact_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    // TODO Only MySQL
    MySQLService.remove_contact(user_id, contact_id);

    Contacts.child(user_id).child(contact_id).set(null, function (err) {
        callback(err);
    });
};

module.exports.add_contact = function (user_id, contact_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    // TODO Only MySQL
    MySQLService.add_contact(user_id, contact_id, function (err) {
        console.log(err);
    });

    Contacts.child(user_id).child(contact_id).set(true, function (err) {
        callback(err);
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