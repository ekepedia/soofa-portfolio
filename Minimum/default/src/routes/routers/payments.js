"use strict";

var express = require('express'),
    _       = require('lodash');

var router  = express.Router();

var AuthService = require("../../services/AuthService");
var PaymentsService = require("../../services/PaymentsService");

// Import Controller
var PaymentsController      = require('../../controllers/PaymentsController');

var Errors = require("../../helpers/Errors");

router.use('*', AuthService.valid_token_middleware);

router.use('*', PaymentsService.generate_customer_id);

router.post('/ephemeral-keys/', function (req, res) {
    if(req.query.api_version !== undefined && req.query.api_version !== null )
        PaymentsController.create_ephemeral_key(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());
});

router.post('/subscriptions/', function (req, res) {
    if(req.query.api_version !== undefined && req.query.api_version !== null &&
        req.body.user_id     !== undefined && req.query.user_id     !== null &&
        req.body.source      !== undefined && req.query.source      !== null )
        PaymentsController.create_subscription(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());
});

module.exports = router;