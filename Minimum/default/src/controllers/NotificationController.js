"use strict";

var _ = require("lodash");

var NotificationService = require("../services/NotificationService");

var Errors = require("../helpers/Errors");

// User methods
module.exports.new_user_active = function (req, res) {

    NotificationService.new_user_active(req.body.user_id, req.body.company_id, function (err, user) {});

    return Errors.RESPOND_WITH_SUCCESS(res);
};
// END user methods

// Group methods
module.exports.new_group_member = function (req, res) {

    NotificationService.new_group_member(req.body.user_id, req.body.group_id, req.body.admin_id, function (err, user) {});

    return Errors.RESPOND_WITH_SUCCESS(res);
};

module.exports.group_name_change = function (req, res) {

    NotificationService.group_name_change(req.body.user_id, req.body.group_id, req.body.old_name, function (err, user) {});

    return Errors.RESPOND_WITH_SUCCESS(res);
};

module.exports.group_photo_change = function (req, res) {

    NotificationService.group_photo_change(req.body.user_id, req.body.group_id, function (err, user) {});

    return Errors.RESPOND_WITH_SUCCESS(res);
};
// END Group methods
