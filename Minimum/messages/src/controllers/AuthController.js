"use strict";

var _    = require("lodash");
var uuid = require("uuid/v4");

var AuthService  = require("../services/AuthService");
var EmailService = require("../services/EmailService");
var UserService  = require("../services/UserService");
var TokenService = require("../services/TokenService");

var Errors = require("../helpers/Errors");

module.exports.signup = function (req, res) {

    AuthService.signup(req.body.email, req.body.password, function (err, response) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            token: response.token,
            user:  response.user
        });
    });

};

module.exports.forgot_password = function (req, res) {

    UserService.find_by_email(req.body.email, function (err, user) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        if(!user.val())
            return Errors.RESPOND_WITH_ERROR(res, Errors.USER_NOT_FOUND());

        user = user.val();
        user = user[_.keys(user)[0]];

        var email = user.email, name = user.name, token = uuid();

        TokenService.add_token(user.user_id, "minimum_password_reset", "production", token, function (err) {
            if(err)
                return Errors.RESPOND_WITH_ERROR(res, err);

            EmailService.send_reset_password_email(email, name, token, function (err) {
                if(err)
                    return Errors.RESPOND_WITH_ERROR(res, err);

                return Errors.RESPOND_WITH_SUCCESS(res);
            });
        });
    });
};

module.exports.reset_password = function (req, res) {

    TokenService.get_token_info(req.body.token, function (err, token) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        if(!token)
            return Errors.RESPOND_WITH_ERROR(res, Errors.RESOURCE_NOT_FOUND());

        if(new Date(token.created_at).getTime() + 2*24*60*60*1000 < new Date().getTime())
            return Errors.RESPOND_WITH_ERROR(res, Errors.TOKEN_EXPIRED());

        if(token.service !== "minimum_password_reset")
            return Errors.RESPOND_WITH_ERROR(res, Errors.INVALID_TOKEN_PAYLOAD());

        UserService.reset_password(token.user_id, function (err) {
            if(err)
                return Errors.RESPOND_WITH_ERROR(res, err);

            TokenService.remove_tokens(token.user_id, token.service, token.environment, function (err) {
                if(err)
                    return Errors.RESPOND_WITH_ERROR(res, err);

                Errors.RESPOND_WITH_SUCCESS(res);

                UserService.getOne(token.user_id, function (err, user) {
                    if(!user.val())
                        return;

                    var email = user.val().email, name = user.val().name;

                    EmailService.send_password_reset_email(email,name);
                });
            });


        });

    });

};

module.exports.register = function (req, res) {

    AuthService.register(
        req.body.company_id,
        req.body.name,
        req.body.email,
        req.body.photo_url,
        function (err, response) {
            if(err)
                return Errors.RESPOND_WITH_ERROR(res, err);

            AuthService.signup(req.body.email, req.body.password, function (err, response) {
                if(err)
                    return Errors.RESPOND_WITH_ERROR(res, err);

                return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                    token: response.token,
                    user:  response.user
                });
            });
    });

};

module.exports.has_password = function (req, res) {

    AuthService.has_password(req.body.email, function (err, response) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            registered: response.registered,
            user:       response.user
        });
    });

};

module.exports.verify = function (req, res) {

    AuthService.verify(req.body.email, function (err, response) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, response);
    });

};

module.exports.login = function (req, res) {

    if(req.query.admin)
        return AuthService.admin_login(req.body.email, req.body.password, function (err, response) {
            if(err)
                return Errors.RESPOND_WITH_ERROR(res, err);

            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                token: response.token
            });
        });

    AuthService.login(req.body.email, req.body.password, function (err, response) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            user:  response.user,
            token: response.token
        });
    });

};

module.exports.valid_token = function (req, res) {

    AuthService.valid_token(req.body.token, function (err, user) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            valid: true,
            user: user
        });
    });

};