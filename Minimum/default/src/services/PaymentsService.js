"use strict";

var _       = require("lodash"),
    winston = require("winston");

var Errors = require("../helpers/Errors");

var UserService = require("../services/UserService");

var stripe_dev = require("stripe")(process.env.STRIPE_TEST_KEY);

var stripe_prod = require("stripe")(process.env.STRIPE_TEST_KEY);

module.exports.generate_customer_id = function (req, res, next) {

    var stripe = set_stripe(req.query.development);

    var customer_query = req.query.development ? "customer_id_dev" : "customer_id";

    req.locals.development = req.query.development;

    var user = req.locals.user;

    if (user[customer_query]){
        req.locals.customer_id = user[customer_query];
        return next();
    }

    stripe.customers.create({
        description: 'Customer for ' + user.email
    }, function(err, customer) {

        if (err)
            return Errors.RESPOND_WITH_ERROR(res, err);

        var customer_update = {};
        customer_update[customer_query] = customer.id;

        UserService.update(user.user_id, customer_update, function (err) {
            if (err)
                return Errors.RESPOND_WITH_ERROR(res, err);

            req.locals.user[customer_query]   = customer.id;
            req.locals.customer_id            = customer.id;

            return next();
        })
    });

};

module.exports.create_ephemeral_key = function(customer_id, stripe_version, development, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    var stripe = set_stripe(development);

    stripe.ephemeralKeys.create(
        {customer: customer_id},
        {stripe_version: stripe_version}
    ).then(function (key) {
        callback(null, key);
    }).catch(function (err) {
        callback(err);
    })
};

module.exports.create_subscription = function(customer_id, user_id, source, stripe_version, development, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    var stripe = set_stripe(development);

    get_subscription_id(user_id, function (err, subscription_id) {

        if(!subscription_id)
            return callback(Errors.MISSING_SUBSCRIPTION_ID());

        /*stripe.customers.update(customer_id, {
            default_source: source
        }, function(err, customer) {
            console.log("customer:", err ? "err" : "nah");

            // asynchronously called
        });

        stripe.charges.create({
            amount: 2000,
            currency: "usd",
            source: source, // obtained with Stripe.js
            description: "Charge for anthony.johnson@example.com"
        }, function(err, charge) {
            // asynchronously called
            console.log("charge:", err ? "err" : "nah");

        });*/

        /*customer_id = "cus_BvmTgVmzg95zrF";
        source        = "card_1BXuuAH3CxjfujGohHoQVwO5";*/

        stripe.subscriptions.create({
                customer: customer_id,
                source:   source,
                items: [
                    {
                        plan: subscription_id
                    }
                ]
            }, function(err, subscription) {

                console.log("subscription:", err);

                return callback(err);
            }
        );
    });
};

function set_stripe(development) {
    return development ? stripe_dev : stripe_prod;
}

function get_subscription_id(user_id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    UserService.getOne(user_id, function (err, user) {
        if(!user.val())
            return callback(null, null);

        return callback(null, user.val().subscription_id);
    });
}