"use strict";

var express = require('express'),
    _       = require('lodash');

var router  = express.Router();

// Import Controller
var MessageController      = require('../../controllers/MessageController');
var AuthService            = require("../../services/AuthService");

var Errors = require("../../helpers/Errors");

router.use('*', AuthService.valid_token_middleware);

router.get('/', function (req, res) {
    MessageController.all(req, res);
});

router.get('/:message_id', function (req, res) {
    MessageController.one(req, res);
});

router.patch('/:thread_id', function (req, res) {
    if(req.params.thread_id !== undefined && req.params.thread_id !== null &&
        req.body !== undefined && req.body !== null && _.keys(req.body).length !== 0
    )
        MessageController.edit_thread(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());
});


router.patch('/:message_id/watched/', function (req, res) {
    if(req.params.message_id !== undefined && req.params.message_id !== null &&
        req.body !== undefined && req.body !== null && _.keys(req.body).length !== 0
    )
        MessageController.watch_message(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());
});

router.patch('/:message_id/delivered/', function (req, res) {
    if(req.params.message_id !== undefined && req.params.message_id !== null &&
        req.body !== undefined && req.body !== null && _.keys(req.body).length !== 0
    )
        MessageController.deliver_message(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());
});

router.post('/', function (req, res) {
    if(req.body !== undefined && req.body !== null && _.keys(req.body).length !== 0 &&
        req.body.sender_id    !== undefined && req.body.sender_id    !== null &&
        req.body.recipient_id !== undefined && req.body.recipient_id !== null &&
        req.body.origin       !== undefined && req.body.origin       !== null &&
        req.body.created_at   !== undefined && req.body.created_at   !== null &&
        (

            req.body.video_url !== undefined && req.body.video_url !== null ||
            req.body.photo_url !== undefined && req.body.photo_url !== null
        )
    )
        MessageController.new(req,res);
    else
        return Errors.RESPOND_WITH_ERROR(res,Errors.MISSING_FIELDS());

});

module.exports = router;