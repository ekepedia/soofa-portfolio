"use strict";

var admin        = require("firebase-admin"),
    Users        = admin.database().ref("Users"),
    OldNames     = admin.database().ref("_OldNames"),
    OldCompanies = admin.database().ref("_OldCompanies"),
    OldUsernames = admin.database().ref("_OldUsernames"),
    TRIE         = require("../managers/managers/TRIE"),
    Contacts     = admin.database().ref("Contacts");

var MySQLService = require("../services/MySQLService");

TRIE = new TRIE(false, true);

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

            if(TRIE.add_user) TRIE.add_user(complete_user);

            callback(null, complete_user.val());

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

module.exports.delete_user = function (user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Users.child(user_id).once("value", function (user) {

        if(!user.val())
            return callback(null, null);

        if(user.val().name){
            OldNames.child(user_id).set(null);
            TRIE.remove("all", user.val().name, user_id);
        }

        if(user.val().company){
            OldCompanies.child(user_id).set(null);
            TRIE.remove("all", user.val().company, user_id);
        }

        if(user.val().username){
            OldUsernames.child(user_id).set(null);
            TRIE.remove("all", user.val().username, user_id);
        }

        Users.child(user_id).set(null);

        callback(null);


    });

};


module.exports.reference = Users;
