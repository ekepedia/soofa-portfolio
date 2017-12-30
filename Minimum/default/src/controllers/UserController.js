"use strict";

var _     = require("lodash"),
    async = require("async");

var UserService  = require("../services/UserService");
var MySQLService = require("../services/MySQLService");

var Errors         = require("../helpers/Errors");

module.exports.edit_user = function (req, res) {

    if(!req.params.user_id || !req.body || _.keys(req.body).length === 0)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    UserService.edit_user(req.params.user_id, req.body, function (err) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS(res);
    });
};

module.exports.get_user = function (req, res) {

    if(!req.params.user_id)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    UserService.getOne(req.params.user_id, function (err, user) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        if(!user.val())
            return Errors.RESPOND_WITH_ERROR(res, Errors.USER_NOT_FOUND());

        user = filter_user(user.val());

        if(req.query.associations && req.locals && req.locals.user) {

            MySQLService.get_follow_relationship(req.locals.user.user_id, req.params.user_id, function (err, relationship) {
                return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                    user: user,
                    associations: {
                        follow: relationship
                    }
                });
            });

        } else {
            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                user: user
            });
        }



    });
};

module.exports.get_users = function (req, res) {

    UserService.getAll(function (err, users) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        var filtered_users = {};

        async.forEachOf(users.val(), function (user, user_id, cb) {
            filtered_users[user_id] = filter_user(user);
            cb(null);
        }, function () {
            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                users: filtered_users
            });
        });
    });
};

module.exports.get_company = function (req, res) {

    UserService.get_company(req.query.company_id, function (err, users) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        var filtered_users = {};

        async.forEachOf(users.val(), function (user, user_id, cb) {
            filtered_users[user_id] = filter_user(user);
            cb(null);
        }, function () {
            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                users: filtered_users
            });
        });
    });
};


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
    user.blurb           = user.blurb           || null;
    user.about_me        = user.about_me        || null;
    user.email           = user.email           || null;
    user.name            = user.name            || null;
    user.photo_url       = user.photo_url       || null;
    user.user_id         = user.user_id         || null;

    user.type            = user.type            || "USER";

    return user;
}