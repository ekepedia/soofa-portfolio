"use strict";

var express = require('express'),
    router  = express.Router(),
    _       = require("lodash");

// Import Controller
var UserController = require('../../controllers/UserController');
var AuthService        = require("../../services/AuthService");

var Errors = require("../../helpers/Errors");

router.use('*', AuthService.valid_token_middleware);

router.patch("/:user_id", function (req, res) {
    try {
        if(req.params.user_id !== undefined && req.params.user_id !== null &&
            req.body !== undefined && req.body !== null &&  _.keys(req.body).length !== 0)
            UserController.edit_user(req, res);
        else
            Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
    } catch (err){
        Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));
    }
});

router.get("/:user_id", function (req, res) {
    try {
        if(req.params.user_id !== undefined && req.params.user_id !== null)
            UserController.get_user(req, res);
        else
            Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
    } catch (err){
        Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));
    }
});

router.get("/", function (req, res) {
    if(req.query.company_id) {
        return UserController.get_company(req, res);
    }

    try {
        UserController.get_users(req, res);
    } catch (err){
        Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));
    }
});


module.exports = router;