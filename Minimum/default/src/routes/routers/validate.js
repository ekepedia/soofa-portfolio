"use strict";

var express = require('express');

var router  = express.Router();

// Import Controller
var ValidatationController = require('../../controllers/ValidatationController');
var AuthService            = require("../../services/AuthService");

router.use('*', AuthService.valid_token_middleware);

router.get("/users", function (req, res) {
    if(req.query.username !== undefined && req.query.username !== null)
        ValidatationController.find_by_username(req, res);
    else
        res.status(400).json(null);
});

router.get("/companies", function (req, res) {
    if(req.query.name !== undefined && req.query.name !== null)
        return ValidatationController.find_by_company(req, res);
    else if(req.query.domain !== undefined && req.query.domain !== null)
        return ValidatationController.find_by_domain(req, res);
    else
        return res.status(400).json(null);
});

module.exports = router;