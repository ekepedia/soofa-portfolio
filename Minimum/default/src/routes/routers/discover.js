"use strict";

var express = require('express'),
    _       = require('lodash');

var router  = express.Router();

var AuthService = require("../../services/AuthService");

// Import Controller
var DiscoverController      = require('../../controllers/DiscoverController');

var Errors = require("../../helpers/Errors");

router.get('/', function (req, res) {
    DiscoverController.get_discover(req, res);
});


module.exports = router;