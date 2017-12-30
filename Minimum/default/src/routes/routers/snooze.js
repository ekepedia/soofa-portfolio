"use strict";

var express = require('express'),
    _       = require('lodash');

var router  = express.Router();

var AuthService = require("../../services/AuthService");

// Import Controller
var SnoozeController      = require('../../controllers/SnoozeController');

var Errors = require("../../helpers/Errors");

router.use('*', AuthService.valid_token_middleware);

router.get('/:user_id/', function (req, res) {
    if(req.params.user_id !== undefined && req.params.user_id !== null )
        SnoozeController.get_snooze_hours(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());
});

router.patch('/:user_id', function (req, res) {
    if(req.params.user_id === undefined || req.params.user_id === null ||
        req.body === undefined || req.body === null || _.keys(req.body).length === 0
    )
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());


    SnoozeController.snooze(req, res);
});

module.exports = router;