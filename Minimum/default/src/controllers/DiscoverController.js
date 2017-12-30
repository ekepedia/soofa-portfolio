"use strict";

var async   = require('async');

var MySQLService = require("../services/MySQLService");
var UserService  = require("../services/UserService");

var Errors = require("../helpers/Errors");

var discover = [
    {
        user_id: "-L-IVbdRkkBEUO19p246",
        category: "DIY",
        cost: 5.00
    }, {
        user_id: "-L-IVmWYcSPCblwQYx1t",
        category: "Yoga",
        cost: 8.00
    }, {
        user_id: "-L0BRichXsHO_sjP6gRY",
        category: "Test",
        cost: 1.23
    }
];

module.exports.get_discover = function (req, res) {

    async.map(discover, function (discover_object, done) {
        async.parallel({
            user: function (cb) {
                UserService.getOne(discover_object.user_id, cb);
            }
        }, function (err, results) {

            results.cost     = discover_object.cost;
            results.category = discover_object.category;
            results.user     = filter_user(results.user.val());

            delete results["relationship"];

            done(err, results);
        });
    }, function (err, users) {
        Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            users: users
        });
    });

};

function filter_user(user) {

    if (!user)
        return user;

    delete user["password"];
    delete user["valid_token_timestamp"];
    delete user["image"];
    delete user["linkedin"];
    delete user["linkedin_id"];
    delete user["updated_at"];

    user.intro_video_url = user.intro_video_url || null;
    user.intro_mov_url   = user.intro_mov_url   || null;
    user.blurb           = user.blurb           || null;
    user.about_me        = user.about_me        || null;
    user.email           = user.email           || null;
    user.name            = user.name            || null;
    user.photo_url       = user.photo_url       || null;
    user.user_id         = user.user_id         || null;

    user.type            = user.type            || "USER";

    return user;
}