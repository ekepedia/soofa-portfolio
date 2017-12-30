"use strict";

var async   = require('async');

var MySQLService = require("../services/MySQLService");

var Errors = require("../helpers/Errors");

module.exports.get_muted_groups = function (req, res) {

    MySQLService.get_muted_groups(req.query.user_id, function (err, muted_groups) {
        if(err){
            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            muted_groups: muted_groups
        });
    })
};

module.exports.get_muted_users = function (req, res) {

    MySQLService.get_muted_users(req.query.group_id, function (err, muted_users) {
        if(err){
            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            muted_users: muted_users
        });
    })
};

module.exports.mute_group = function (req, res) {

    MySQLService.mute_group(req.body.user_id, req.body.group_id, function (err) {
        if(err){
            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        return Errors.RESPOND_WITH_SUCCESS(res);
    })
};

module.exports.unmute_group = function (req, res) {

    MySQLService.unmute_group(req.body.user_id, req.body.group_id, function (err) {
        if(err){
            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        return Errors.RESPOND_WITH_SUCCESS(res);

    })
};