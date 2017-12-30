"use strict";

var _ = require("lodash");

var TokenService    = require("../services/TokenService");

var Errors = require("../helpers/Errors");

module.exports.get_tokens = function (req, res) {

    TokenService.get_tokens(req.params.user_id, req.query.service, req.query.environment, function (err, tokens) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            tokens: tokens
        })
    });
};

module.exports.add_token = function (req, res) {

    TokenService.add_token(req.params.user_id, req.body.service, req.body.environment, req.body.token, function (err, tokens) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS(res);
    });
};

module.exports.remove_token = function (req, res) {

    TokenService.remove_token(req.params.user_id, req.body.service, req.body.environment, req.body.token, function (err, tokens) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS(res);
    });
};