"use strict";

var apn     = require('apn'),
    async   = require('async'),
    moment  = require('moment'),
    winston = require('winston'),
    _       = require('lodash');

var options_dev = {
    token: {
        key: "src/config/APNsAuthKey_NV3T37DN9R.p8",
        keyId: "NV3T37DN9R",
        teamId: "G2Q624MGXV"
    },
    production: false
};

var options_prod = {
    token: {
        key: "src/config/APNsAuthKey_NV3T37DN9R.p8",
        keyId: "NV3T37DN9R",
        teamId: "G2Q624MGXV"
    },
    production: true
};

var DevApnProvider  = new apn.Provider(options_dev);
var ProdApnProvider = new apn.Provider(options_prod);

DevApnProvider.env  = "dev";
ProdApnProvider.env = "prod";

var Users               = require("../models/Users"),
    GroupService        = require("../services/GroupService"),
    MySQLService        = require("../services/MySQLService");

var admin        = require("firebase-admin"),
    Companies    = admin.database().ref("Companies"),
    Contacts     = admin.database().ref("Contacts");

var Errors = require("../helpers/Errors");

var NotificationQueue = admin.database().ref("NotificationQueue");

function clean(name) {
    if(!name) return "Unknown";

    var names = name.split(" ");
    return names.length > 1 ? names[0] : name;
}

module.exports.new_group_member = function (in_user_id, group_id, admin_id, callback) {

    if(!in_user_id || !group_id)
        return callback(Errors.MISSING_FIELDS());

    async.parallel({
        user: function (cb) {
            Users.reference.child(in_user_id).once("value", function (user) {
                cb(null, user);
            });
        },
        admin: function (cb) {
            Users.reference.child(admin_id).once("value", function (user) {
                cb(null, user);
            });
        },
        group: function (cb) {
            MySQLService.get_group(group_id, function (err, group) {
                cb(err, group[0]);
            });
        }
    }, function (err, metadata) {
        if(err){
            winston.error(err);
            return callback(Errors.API_ERROR(err));
        }

        if(!metadata.user.val() || !metadata.group || !metadata.admin.val())
            return callback(Errors.RESOURCE_NOT_FOUND());

        var name    = clean(metadata.user.val().name);
        var admin   = clean(metadata.admin.val().name);
        var group   = metadata.group.name;

        if(!name || !group || !admin)
            return callback(Errors.RESOURCE_NOT_FOUND());

        GroupService.get_recipients(group_id, function (err, users) {
            async.each(users, function (user_id, cb) {

                var title = "Welcome " + name + "!";
                var body  = name + " was just added to your group " + group + ". Jump in to say hello!";

                if(user_id === in_user_id){
                    title = group + ' Group';
                    body  = admin + " just added you to the " + group + " group. Jump in to say hello!";
                }

                NotificationQueue.push({
                    user_id: user_id,
                    title:   title,
                    body:    body,
                    scope:   "system"
                });

            }, function (err) {
                callback(err);
            });
        });

    });
};

module.exports.group_name_change = function (in_user_id, group_id, old_name, callback) {

    if(!in_user_id || !group_id || !old_name)
        return callback(true);

    async.parallel({
        user: function (cb) {
            Users.reference.child(in_user_id).once("value", function (user) {
                cb(null, user);
            });
        },
        group: function (cb) {
            MySQLService.get_group(group_id, function (err, group) {
                cb(err, group[0]);
            });
        }
    }, function (err, metadata) {
        if(err)
            return callback(err);

        if(!metadata.user.val() || !metadata.group)
            return callback(true);

        var name    = clean(metadata.user.val().name);
        var group   = metadata.group.name;

        if(!name || !group)
            return callback(true);

        GroupService.get_recipients(group_id, function (err, users) {
            async.each(users, function (user_id, cb) {
                if(user_id === in_user_id)
                    return cb(null);

                var title = old_name + ' Group';
                var body  = name + " just changed the name of your group " + old_name + ". It's now called \"" + group + "\"";

                NotificationQueue.push({
                    user_id: user_id,
                    title:   title,
                    body:    body,
                    scope:   "system"
                });
            }, function (err) {
                callback(err);
            });
        });

    });
};

module.exports.group_photo_change = function (in_user_id, group_id, callback) {

    if(!in_user_id || !group_id)
        return callback(true);

    async.parallel({
        user: function (cb) {
            Users.reference.child(in_user_id).once("value", function (user) {
                cb(null, user);
            });
        },
        group: function (cb) {
            MySQLService.get_group(group_id, function (err, group) {
                cb(err, group[0]);
            });
        }
    }, function (err, metadata) {
        if(err)
            return callback(err);

        if(!metadata.user.val() || !metadata.group)
            return callback(true);

        var name    = clean(metadata.user.val().name);
        var group   = metadata.group.name;

        if(!name || !group)
            return callback(true);

        GroupService.get_recipients(group_id, function (err, users) {
            async.each(users, function (user_id, cb) {
                if(user_id === in_user_id)
                    return cb(null);

                var title = group + ' Group';
                var body  = name + " just changed the group photo for " + group + ". Jump in to see what it is now."

                NotificationQueue.push({
                    user_id: user_id,
                    title:   title,
                    body:    body,
                    scope:   "system"
                });

            }, function (err) {
                callback(err);
            });
        });

    });
};

module.exports.new_user_active = function (in_user_id, company_id) {

    if(!in_user_id || !company_id)
        return;

    async.parallel({
        user: function (cb) {
            Users.reference.child(in_user_id).once("value", function (user) {
                cb(null, user);
            });
        },
        company: function (cb) {
            Companies.child(company_id).once("value", function (company) {
                cb(null, company);
            });
        }
    }, function (err, metadata) {
        if(err)
            return winston.error(err);

        if(!metadata.user.val() || !metadata.company.val())
            return;

        var name    = clean(metadata.user.val().name);
        var company = metadata.company.val().name;

        if(!name || !company)
            return;

        if(!metadata.user.val().active)
            try {
                Users.reference.child(in_user_id).child("active").set(new Date().getTime());
            } catch (e) {
                console.log(e);
            }

        TRIE.change(metadata.user);

        try {
            GroupService.add_to_company_group(in_user_id, company_id);
        } catch (e) {

        }

        Users.reference.orderByChild("company_id").equalTo(company_id).once("value", function (users) {
            async.forEachOf(users.val(), function (user, user_id, cb) {
                if(user_id === in_user_id)
                    return cb(null);

                var title = "Welcome " + name + "!";
                var body  = name + " from " + company + " just joined Minimum. Jump in to say hello!";

                MySQLService.add_contact(user_id, in_user_id);
                MySQLService.add_contact(in_user_id, user_id);

                Contacts.child(user_id).child(in_user_id).set(true);
                Contacts.child(in_user_id).child(user_id).set(true);

                NotificationQueue.push({
                    user_id: user_id,
                    title:   title,
                    body:    body,
                    scope:   "system"
                });
            });
        });

    });
};
