"use strict";

var express = require('express'),
    winston = require('winston'),
    _       = require('lodash');

var router  = express.Router();

var AuthService = require("../../services/AuthService");

var AssociationController = require("../../controllers/AssociationController");

// Import Controller
var Errors = require("../../helpers/Errors");

router.use('*', AuthService.valid_token_middleware);

router.get('/', function (req, res) {

    AssociationController.get_associations(req, res);

});

router.get('/requests', function (req, res) {

    AssociationController.get_association_requests(req, res);

});

router.post('/requests', function (req, res) {

    AssociationController.add_association_request(req, res);

});

router.put('/requests', function (req, res) {

    AssociationController.edit_association_request(req, res);

});

router.delete('/requests', function (req, res) {

    AssociationController.remove_association_request(req, res);

});

router.delete('/', function (req, res) {

    AssociationController.remove_association(req, res);

});


module.exports = router;