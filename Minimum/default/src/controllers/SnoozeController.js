"use strict";

var async   = require('async');

var MySQLService = require("../services/MySQLService");

var Errors = require("../helpers/Errors");

module.exports.get_snooze_hours = function (req, res) {

    MySQLService.get_snooze_hours(req.params.user_id, function (err, snooze_hours) {
        if(err){
            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        delete snooze_hours["user_id"];

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, snooze_hours);
    })
};

module.exports.snooze = function (req, res) {

    var user_id     = req.params.user_id   !== null && req.params.user_id   !== undefined ? String(req.params.user_id)   : null;
    var start_time  = req.body.start_time  !== null && req.body.start_time  !== undefined ? String(req.body.start_time)  : null;
    var end_time    = req.body.end_time    !== null && req.body.end_time    !== undefined ? String(req.body.end_time)    : null;
    var active_date = req.body.active_date !== null && req.body.active_date !== undefined ? String(req.body.active_date) : null;

    if(!(start_time && end_time) && !active_date)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    async.series([
        function (cb) {
            if(user_id && start_time && end_time)
                MySQLService.set_snooze_hours(user_id, start_time, end_time, cb);
            else
                cb(null);
        },
        function (cb) {
            if(user_id && active_date)
                MySQLService.snooze(user_id, active_date, cb);
            else
                cb(null);
        }
    ], function (err) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS(res);
    });
};