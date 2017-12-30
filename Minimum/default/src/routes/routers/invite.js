"use strict";

var express = require('express'),
    winston = require('winston'),
    _       = require('lodash');

var router  = express.Router();

var AuthService = require("../../services/AuthService");

var InviteController = require("../../controllers/InviteController");

// Import Controller
var Errors = require("../../helpers/Errors");

router.use('*', AuthService.valid_token_middleware);

router.post('/', function (req, res) {

    InviteController.invite_users(req, res);

});

module.exports = router;