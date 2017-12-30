"use strict";

var express = require('express'),
    _       = require('lodash');

var router  = express.Router();

var AuthService = require("../../services/AuthService");

// Import Controller
var MutedGroupsController = require('../../controllers/MutedGroupsController');

var Errors = require("../../helpers/Errors");

router.use('*', AuthService.valid_token_middleware);

router.get('/', function (req, res) {
    if(req.query.user_id !== undefined && req.query.user_id !== null )
        MutedGroupsController.get_muted_groups(req, res);
    else if(req.query.group_id !== undefined && req.query.group_id !== null )
        MutedGroupsController.get_muted_users(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());
});

router.post('/', function (req, res) {
    if(req.body.user_id !== undefined && req.body.user_id !== null &&
        req.body.group_id !== undefined && req.body.group_id !== null)
        MutedGroupsController.mute_group(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());
});

router.delete('/', function (req, res) {
    if(req.body.user_id !== undefined && req.body.user_id !== null &&
        req.body.group_id !== undefined && req.body.group_id !== null)
        MutedGroupsController.unmute_group(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());
});

module.exports = router;