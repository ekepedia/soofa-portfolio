"use strict";

var async   = require('async');
var winston = require("winston");

var MySQLService = require("../services/MySQLService");
var UserService  = require("../services/UserService");

var admin        = require("firebase-admin"),
    EmailQueue   = admin.database().ref("EmailQueue");

var Errors = require("../helpers/Errors");

var Analytics = require('analytics-node');
var analytics = new Analytics(process.env.ANALYTICS_WRITE_KEY);

module.exports.invite_users = function (req, res) {

    if (!req.body.user_id || !req.body.users )
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    var user_id = req.body.user_id;
    var users   = req.body.users;

    try {
        users = (typeof users !== 'string') ? users : JSON.parse(users);
    } catch (e) {
        return winston.error(e);
    }

    UserService.getOne(user_id, function (err, user) {

        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        if(!user.val())
            return Errors.RESPOND_WITH_ERROR(res, Errors.USER_NOT_FOUND());

        var name    = user.val().name;
        var company = user.val().company;

        async.each(users, function (invitee_id, done) {
            UserService.getOne(invitee_id, function (err, invitee) {

                if(err || !invitee.val())
                    return done(null);

                var email        = invitee.val().email;
                var invitee_name = invitee.val().name;

                if(!email || !name || !company || !invitee_name)
                    return done(null);

                winston.info("New Invite: " + email + " " + name + " " + company + " " + invitee_name);

                analytics.track({
                    userId: user_id,
                    event: 'Invite User',
                    properties: {
                        inviter_name: name,
                        invitee_name: invitee_name,
                        email:        email
                    }
                });

                EmailQueue.push({
                    type:         "invite-email",
                    email:        email,
                    name:         name,
                    company:      company,
                    invitee_name: invitee_name
                }, function () {
                    return done(null);
                });

            });
        }, function () {
            Errors.RESPOND_WITH_SUCCESS(res);
        });

    });



};