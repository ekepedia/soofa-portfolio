"use strict";

var express = require('express'),
    _       = require('lodash');

var router  = express.Router();

var AuthService = require("../../services/AuthService");

// Import Controller
var StoryController      = require('../../controllers/StoryController');

var Errors = require("../../helpers/Errors");

router.use('*', AuthService.valid_token_middleware);

router.get('/', function (req, res) {
    StoryController.get_stories(req, res);
});


module.exports = router;