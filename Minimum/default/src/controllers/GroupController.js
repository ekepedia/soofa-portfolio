"use strict";

var uuid    = require("uuid/v1");
var _       = require("lodash");
var async   = require("async");
var winston = require("winston");

var GroupService        = require("../services/GroupService");
var MySQLService        = require("../services/MySQLService");
var NotificationService = require("../services/NotificationService");

var Errors         = require("../helpers/Errors");

module.exports.all = function (req, res) {
    if(!req.params.user_id)
        return res.json(new Error("Missing user id"));

    GroupService.populate_groups(req.params.user_id, function (err, populated_groups) {
        if(err)
            return res.json(err);

        return res.json(populated_groups);
    });
};

module.exports.one = function (req, res) {
    if(!req.params.group_id)
        return res.json(new Error("Missing group id"));

    GroupService.populate_group(req.params.group_id, function (err, populated_group) {
        if(err)
            return res.json(err);

        return res.json(populated_group);
    });
};

module.exports.all_v = function (req, res) {
    if(!req.query.user_id)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    GroupService.populate_groups_sql(req.query.user_id, function (err, populated_groups) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            groups: populated_groups
        });
    });
};

module.exports.one_v = function (req, res) {
    if(!req.params.group_id)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    GroupService.populate_group_sql(req.params.group_id, function (err, populated_group) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            group: populated_group
        });
    });
};

module.exports.add_group = function (req, res) {
    req.body.group_id = req.body.group_id || uuid();

    if(!req.body.group_id || !req.body.name || !req.body.photo_url)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    GroupService.add_group(req.body.group_id, req.body.name, req.body.photo_url, function (err) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        // TODO Handle errors from failed bulk add
        if(req.body.members){
            try {
                req.body.members = (typeof req.body.members !== 'string') ? req.body.members : JSON.parse(req.body.members);

                GroupService.add_group_members(req.body.group_id, req.body.members, function (err) {
                    if (req.locals.user && req.locals.user.user_id) {

                        async.each(req.body.members, function (new_user_id, cb) {

                            new_user_id += "";

                            NotificationService.new_group_member(new_user_id, req.body.group_id, req.locals.user.user_id, function (err) {
                                if(err){
                                    winston.error(err);
                                }
                                cb(null);
                            });
                        });

                    }
                });

            } catch (err){
                // TODO Handle error
            }
        }

        return Errors.RESPOND_WITH_SUCCESS(res);
    });
};

module.exports.remove_group = function (req, res) {

    if(!req.params.group_id)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    GroupService.remove_group(req.params.group_id, function (err) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS(res);
    });
};

module.exports.edit_group = function (req, res) {

    if(!req.params.group_id || !req.body || _.keys(req.body).length === 0)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    GroupService.edit_group(req.params.group_id, req.body, function (err) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        if(req.locals.user && req.locals.user.user_id && req.locals.old_group) {

            async.parallel({
                name: function (cb) {
                    if(req.body.name && req.body.name !== req.locals.old_group.name)
                        NotificationService.group_name_change(req.locals.user.user_id, req.params.group_id, req.locals.old_group.name, function (err) {
                            return cb(err);
                        });
                    else
                        return cb(null);
                },
                photo: function (cb) {
                    if(req.body.photo_url && req.body.photo_url !== req.locals.old_group.photo_url)
                        NotificationService.group_photo_change(req.locals.user.user_id, req.params.group_id, function (err) {
                            return cb(err);
                        });
                    else
                        return cb(null);
                }
            }, function (err) {
                if(err)
                    return Errors.RESPOND_WITH_ERROR(res, err);

                return Errors.RESPOND_WITH_SUCCESS(res);
            });
        } else {
            return Errors.RESPOND_WITH_SUCCESS(res);

        }
    });
};

module.exports.add_group_member = function (req, res) {

    if(!req.params.group_id || !req.body.user_id)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    GroupService.add_group_member(req.params.group_id, req.body.user_id, function (err) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        if(req.locals.user && req.locals.user.user_id) {
            NotificationService.new_group_member(req.body.user_id, req.params.group_id, req.locals.user.user_id, function (err, user) {
                if(err){
                    winston.error(err);
                    // return Errors.RESPOND_WITH_ERROR(res, err);
                }

                return Errors.RESPOND_WITH_SUCCESS(res);
            });
        } else {
            return Errors.RESPOND_WITH_SUCCESS(res);

        }
    });
};

module.exports.add_group_admin = function (req, res) {

    if(!req.params.group_id || !req.body.user_id)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    GroupService.add_group_admin(req.params.group_id, req.body.user_id, function (err) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS(res);
    });
};

module.exports.remove_group_member = function (req, res) {

    if(!req.params.group_id || !req.body.user_id)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    GroupService.remove_group_member(req.params.group_id, req.body.user_id, function (err) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS(res);
    });
};