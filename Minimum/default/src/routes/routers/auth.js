"use strict";

var express = require('express');
var router  = express.Router();

var winston = require("winston");

// Import Controller
var AuthController = require('../../controllers/AuthController');

var Errors         = require("../../helpers/Errors"),
    MISSING_FIELDS = Errors.MISSING_FIELDS;

router.post('/signup', function (req, res) {
    if(req.body.email !== undefined && req.body.email !== null &&
        req.body.password !== undefined && req.body.password
    )
        return AuthController.signup(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.post('/forgot-password', function (req, res) {
    if (req.body.email !== undefined && req.body.email !== null) {
        return AuthController.forgot_password(req, res);
    }
    else if (req.body.token !== undefined && req.body.token !== null) {
        return AuthController.reset_password(req, res);
    }
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.post('/register', function (req, res) {
    if(req.body.email !== undefined && req.body.email !== null &&
        req.body.password !== undefined && req.body.password !== null &&
        req.body.name !== undefined && req.body.name !== null
    )
        return AuthController.register(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.post('/has_password', function (req, res) {
    if(req.body.email !== undefined && req.body.email !== null)
        return AuthController.has_password(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.post('/verify', function (req, res) {
    if(req.body.email !== undefined && req.body.email !== null)
        return AuthController.verify(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.post('/login', function (req, res) {
    if(req.body.email !== undefined && req.body.email !== null &&
        req.body.password !== undefined && req.body.password
    )
        return AuthController.login(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.get('/companies', function (req, res) {
    if(req.query.company_name !== undefined && req.query.company_name !== null)
        return AuthController.company_lookup(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.post('/companies', function (req, res) {
    if(req.body.name !== undefined && req.body.name !== null)
        return AuthController.new_company(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.post('/valid_token', function (req, res) {
    if(req.body.token !== undefined && req.body.token !== null)
        return AuthController.valid_token(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

module.exports = router;