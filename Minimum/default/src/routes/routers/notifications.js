"use strict";

var express = require('express');

var router  = express.Router();

// Import Controller
var NotificationController = require('../../controllers/NotificationController');
var AuthService            = require("../../services/AuthService");

var Errors         = require("../../helpers/Errors"),
    MISSING_FIELDS = Errors.MISSING_FIELDS();

router.use('*', AuthService.valid_token_middleware);

router.post("/new-group-member", function (req, res) {
    if(req.body.user_id !== undefined && req.body.user_id !== null &&
        req.body.group_id !== undefined && req.body.group_id &&
        req.body.admin_id !== undefined && req.body.admin_id
    )
        return NotificationController.new_group_member(req, res);
   else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.post("/new-user-active", function (req, res) {
    if(req.body.user_id !== undefined && req.body.user_id !== null &&
        req.body.company_id !== undefined && req.body.company_id !== null)
        return NotificationController.new_user_active(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

});

router.post("/group-photo-change", function (req, res) {
    if(req.body.user_id !== undefined && req.body.user_id !== null &&
        req.body.group_id !== undefined && req.body.group_id !== null)
        return NotificationController.group_photo_change(req, res);
    else
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

router.post("/group-name-change", function (req, res) {
     if(req.body.user_id !== undefined && req.body.user_id !== null &&
         req.body.group_id !== undefined && req.body.group_id !== null &&
         req.body.old_name !== undefined && req.body.old_name !== null)
        return NotificationController.group_name_change(req, res);
     else
         return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
});

module.exports = router;