"use strict";

var Errors          = require("../helpers/Errors");
var PaymentsService = require("../services/PaymentsService");

module.exports.create_ephemeral_key = function (req, res) {
    var stripe_version = req.query.api_version;

    if (!stripe_version) {
        res.status(400).end();
        return;
    }

    var customer_id = req.locals.customer_id;
    var development = req.locals.development;

    PaymentsService.create_ephemeral_key(customer_id, stripe_version, development, function (err, key) {
        if(err)
            return res.status(500).json(err);

        return res.json(key);
    });

};

module.exports.create_subscription = function (req, res) {
    var stripe_version = req.query.api_version;

    if (!stripe_version) {
        Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
        return;
    }

    var customer_id = req.locals.customer_id;
    var development = req.locals.development;
    var user_id     = req.body.user_id;
    var source      = req.body.source;

    PaymentsService.create_subscription(customer_id, user_id, source, stripe_version, development, function (err, key) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        return Errors.RESPOND_WITH_SUCCESS(res, err);
    });

};