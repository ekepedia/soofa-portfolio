"use strict";

var async   = require('async');

var MySQLService = require("../services/MySQLService");

var Errors = require("../helpers/Errors");

module.exports.get_stories = function (req, res) {

    MySQLService.get_stories(req.query.influencer_id, function (err, stories) {
        if(err){
            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            threads: stories
        });
    });

};