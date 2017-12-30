"use strict";

var express = require('express');

var router  = express.Router();

// Import Controller
var TokenController = require('../../controllers/TokenController');

var AuthService     = require("../../services/AuthService");

var Errors = require("../../helpers/Errors");

router.use('*', AuthService.valid_token_middleware);

router.get("/:user_id", function (req, res) {
    if(req.params.user_id     !== undefined && req.params.user_id    !== null &&
        req.query.service     !== undefined && req.query.service     !== null &&
        req.query.environment !== undefined && req.query.environment !== null
    )
        TokenController.get_tokens(req, res);
    else
        Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.post("/:user_id", function (req, res) {
    if(req.params.user_id    !== undefined && req.params.user_id   !== null &&
        req.body.service     !== undefined && req.body.service     !== null &&
        req.body.environment !== undefined && req.body.environment !== null &&
        req.body.token       !== undefined && req.body.token       !== null
    )
        TokenController.add_token(req, res);
    else
        Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.delete("/:user_id", function (req, res) {
    if(req.params.user_id    !== undefined && req.params.user_id   !== null &&
        req.body.service     !== undefined && req.body.service     !== null &&
        req.body.environment !== undefined && req.body.environment !== null &&
        req.body.token       !== undefined && req.body.token       !== null
    )
        TokenController.remove_token(req, res);
    else
        Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

module.exports = router;