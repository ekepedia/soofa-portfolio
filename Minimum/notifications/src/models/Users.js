"use strict";

var admin    = require("firebase-admin"),
    Users    = admin.database().ref("Users"),
    Contacts = admin.database().ref("Contacts");

var MySQLService = require("../services/MySQLService");


var async = require("async");
var Errors = require("../helpers/Errors");

module.exports.findById = function (user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id)
        return callback(new Error("Missing fields"));

    Users.child(user_id).once("value", function(data) {
        callback(null, data);
    });
};

module.exports.find_by_username = find_by_username;

function find_by_username (username, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!username)
        return callback(new Error("Missing fields"));

    Users.orderByChild("username").equalTo(username).limitToLast(1).once("value", function(data) {
        callback(null, data);
    });
}

module.exports.find_by_email = function (email, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!email)
        return callback(new Error("Missing fields"));

    Users.orderByChild("email").equalTo(email).limitToLast(1).once("value", function(data) {
        callback(null, data);
    });
};

module.exports.all = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Users.once("value", function(data) {
        callback(null, data);
    });

};

module.exports.update = function (user_id, updates, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user_id || !updates)
        return callback(new Error("Missing fields"));

    if (updates.username) {
        find_by_username(updates.username, function (err, user) {
            if(user.val() && !user.val()[user_id]) {
                return callback(Errors.DUPLICATE_USERNAME());
            } else {
                Users.child(user_id).update(updates, function (err) {
                    callback(err, updates);
                });
            }
        });
    } else {
        Users.child(user_id).update(updates, function (err) {
            callback(err, updates);
        });
    }
};

module.exports.new = function (user, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!user)
        return callback(new Error("Missing fields"));

    var new_user = Users.push(user);

    Users.child(new_user.key).child("user_id").set(new_user.key, function () {

        Users.child(new_user.key).once("value", function (complete_user) {

            callback(null, complete_user.val());

            Users.orderByChild("company_id").equalTo(user.company_id).once("value", function (company_members) {
                async.forEachOf(company_members.val(), function (company_member, company_member_id, cb) {

                    if(company_member_id === new_user.key)
                        return cb(null);

                    MySQLService.add_contact(company_member_id, new_user.key);
                    MySQLService.add_contact(new_user.key, company_member_id);

                    Contacts.child(company_member_id).child(new_user.key).set(true);
                    Contacts.child(new_user.key).child(company_member_id).set(true);

                    return cb(null);

                });
            });

        });

    });
};

module.exports.get_contacts = function (user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Contacts.child(user_id).once("value", function (contacts) {

        if(!contacts)
            return callback(null, null);

        var populated_contacts = {};

        async.forEachOf(contacts.val(), function (is_contact, user_id, cb) {
            Users.child(user_id).once("value", function (user) {

                if(!user || !user.val())
                    return cb(null);

                populated_contacts[user_id] = user.val();

                return cb(null);

            });
        }, function (err) {

            if(err) return callback(err);

            return callback(null, populated_contacts);

        });

    });
};

module.exports.get_all_contacts = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Contacts.once("value", function (contacts) {

        if(!contacts || !contacts.val || !contacts.val())
            return callback(null, null);

        return callback(null, contacts.val());

    });
};

module.exports.reference = Users;
