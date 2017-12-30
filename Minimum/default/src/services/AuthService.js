"use strict";

var jwt       = require("jsonwebtoken");
var User      = require("../models/Users");
var async      = require("async");
var bcrypt    = require("bcrypt");
var _         = require("lodash");
var winston   = require("winston");

var Errors      = require("../helpers/Errors");
var UserService = require("../services/UserService");

var TRIE        = require("../managers/managers/TRIE");

TRIE = new TRIE(false, true);

var admins = ["7","34","20"];

var Analytics = require('analytics-node');
var analytics = new Analytics(process.env.ANALYTICS_WRITE_KEY);

module.exports.register = function (name, email, photo_url, username, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!name || !email || !username)
        return callback(Errors.MISSING_FIELDS());

    email = email.toLowerCase().trim();

    if(!get_domain(email))
        return callback(Errors.INVALID_FIELD_TYPE());

    async.parallel({
        email: function (cb) {
            User.find_by_email(email, function (err, user) {
                cb(err, user);
            });
        },
        username: function (cb) {
            User.find_by_username(username, function (err, user) {
                cb(err, user);
            });
        }
    }, function (err, results) {

        if(err)
            return callback(Errors.API_ERROR(err));

        var user = results.email.val() || results.username.val();

        if(user)
            return callback(Errors.DUPLICATE_SIGN_UP());

        UserService.new({
            name:       name,
            email:      email,
            photo_url:  photo_url,
            username:   username
        }, function (err, complete_user) {

            try {
                analytics.track({
                    userId: complete_user.user_id,
                    event: 'Registration',
                    properties: {
                        name:       complete_user.name,
                        email:      complete_user.email
                    }
                });
            } catch (e) {
                winston.error(e);
            }

            return callback(err);

        });

    });
};

module.exports.signup = function (email, password, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!email || !password)
        return callback(Errors.MISSING_FIELDS());

    email = email.toLowerCase().trim();

    User.find_by_email(email, function (err, user) {
        if(err)
            return callback(Errors.API_ERROR(err));

        if(!user || !user.val || !user.val())
            return callback(Errors.USER_NOT_FOUND());

        user = user.val()[_.keys(user.val())[0]];

        if(user.password)
            return callback(Errors.DUPLICATE_SIGN_UP());

        bcrypt.hash(password, 10, function(err, hash) {
            if(err)
                return callback(err);

            if(!user.user_id)
                return callback(Errors.MISSING_FIELDS());

            User.update(user.user_id, {
                password: hash,
                valid_token_timestamp: new Date().getTime()/1000 - 10
            }, function (err) {
                if (err)
                    return callback(Errors.API_ERROR(err));

                jwt.sign({ user_id: user.user_id }, process.env.TOKEN_SECRET, {
                    expiresIn: "1000d",
                    issuer: process.env.TOKEN_ISSUER
                }, function(err, token) {
                    if(err)
                        return callback(Errors.API_ERROR(err));

                    try {
                        analytics.track({
                            userId: user.user_id,
                            event: 'Sign Up',
                            properties: {
                                name:       user.name,
                                email:      user.email
                            }
                        });
                    } catch (e) {
                        winston.error(e);
                    }

                    TRIE.change_by_id(user.user_id);

                    return callback(null, {
                        token: token,
                        user:  user
                    });
                });

            })
        });
    });
};

module.exports.has_password = function (email, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if (!email)
        return callback(Errors.MISSING_FIELDS());

    email = email.toLowerCase().trim();

    User.find_by_email(email, function (err, user) {
        if(err)
            return callback(Errors.API_ERROR(err));

        if(!user || !user.val || !user.val())
            return callback(Errors.RESOURCE_NOT_FOUND());

        user = user.val()[_.keys(user.val())[0]];

        return callback(null, {
            registered: user.password !== null && user.password !== undefined,
            user: user
        });

    });
};

module.exports.verify = function (email, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if (!email)
        return callback(Errors.MISSING_FIELDS());

    email = email.toLowerCase().trim();

    User.find_by_email(email, function (err, user) {
        if(err)
            return callback(Errors.API_ERROR(err));

        var password   = null;
        var registered = false;

        if(user && user.val && user.val()) {
            user       = user.val()[_.keys(user.val())[0]];
            password   = user.password !== null && user.password !== undefined;
            registered = true;
        } else {
            user = null;
        }

        return callback(null, {
            registered:  registered,
            password:    password,
            user:        clean_user(user)
        });

    });
};


module.exports.login = login;

function login (email, password, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!email || !password)
        return callback(Errors.MISSING_FIELDS());

    email = email.toLowerCase().trim();

    async.parallel({
        email: function (cb) {
            User.find_by_email(email, function (err, user) {
                cb(err, user);
            });
        },
        username: function (cb) {
            User.find_by_username(email, function (err, user) {
                cb(err, user);
            });
        }
    }, function (err, results) {
        if(err)
            return callback(Errors.API_ERROR(err));

        var user = results.email.val() || results.username.val();

        if(!user)
            return callback(Errors.USER_NOT_FOUND());

        user = user[_.keys(user)[0]];

        if(!user.password)
            return callback(Errors.USER_PASSWORD_NOT_SET());

        bcrypt.compare(password, user.password, function(err, valid) {
            if(err)
                return callback(Errors.API_ERROR(err));

            if(!valid)
                return callback(Errors.WRONG_PASSWORD());

            User.update(user.user_id, {
                valid_token_timestamp: user.valid_token_timestamp || (new Date().getTime()/1000 - 10)
            }, function (err) {
                if(err)
                    return callback(err);

                jwt.sign({ user_id: user.user_id }, process.env.TOKEN_SECRET, {
                    expiresIn: "1000d",
                    issuer: process.env.TOKEN_ISSUER
                }, function(err, token) {
                    if(err)
                        return callback(Errors.API_ERROR(err));

                    TRIE.change_by_id(user.user_id);

                    return callback(null, {
                        user: user,
                        token: token
                    });
                });

            });

        });
    });

};

module.exports.admin_login = function (email, password, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!email || !password)
        return callback(Errors.MISSING_FIELDS());

    email = email.toLowerCase().trim();

    login(email, password, function (err, data) {

        if(err)
            return err;

        if(!data || !data.user || !data.token || !data.user.user_id)
            return callback(new Error("Not Authorized"));

        if(admins.indexOf(data.user.user_id) === -1)
            return callback(new Error("Not Authorized"));

        return callback(null, {
            token: data.token
        });
    });

};

module.exports.valid_token = valid_token;

function valid_token (token, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!token)
        return callback(Errors.MISSING_FIELDS());

    jwt.verify(token, process.env.TOKEN_SECRET, function(err, payload) {
        if(err)
            return callback(Errors.API_ERROR(err));

        if(!payload.user_id || !payload.iat || !payload.iss || payload.iss !== process.env.TOKEN_ISSUER)
            return callback(Errors.INVALID_TOKEN_PAYLOAD());

        User.findById(payload.user_id, function (err, user) {
            if(err)
                return callback(Errors.API_ERROR(err));

            if(!user || !user.val || !user.val())
                return callback(Errors.USER_NOT_FOUND());

            user = user.val();

            if(!user.valid_token_timestamp || (user.valid_token_timestamp - 10) > payload.iat)
                return callback(Errors.TOKEN_EXPIRED());

            return callback(null, {
                user: user
            });

        })
    });
}

module.exports.valid_token_middleware =  function (req, res, next) {

    var auth = req.headers.authorization;

    if(!auth || typeof auth !== "string") {
        winston.log("debug", "Missing authorization headers @ " + req.originalUrl);
        // TODO Replace with returning null
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_AUTHORIZATION_HEADER());
    }

    auth = auth.split(" ");

    if(auth.length !== 2 || auth[0] !== "Bearer") {
        winston.error("Malformed authorization header '" + auth.join(" ") + "' @ " + req.originalUrl);
        // TODO Replace with returning null
        return Errors.RESPOND_WITH_ERROR(res, Errors.MALFORMED_AUTHORIZATION_HEADER());
    }

    var token = auth[1];

    valid_token(token, function (err, data) {
        if(err){
            winston.log("debug", "Invalid authorization header '" + auth.join(" ") +"'; "+ JSON.stringify(err, null, 4) + " @ " + req.originalUrl);
            // TODO Replace with returning null

            if(err && err.error && err.error.message)
                err.error.message = "Authorization Error: " + err.error.message;

            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        req.locals.user  = data.user;
        req.locals.token = token;

        return next();
    });
};

module.exports.admin_token_middleware =  function (req, res, next) {

    var auth = req.headers.authorization;

    if(!auth || typeof auth !== "string") {
        winston.log("debug", "Missing authorization headers @ " + req.originalUrl);
        // TODO Replace with returning null
        return next();
    }

    auth = auth.split(" ");

    if(auth.length !== 2 || auth[0] !== "Bearer") {
        winston.error("Malformed authorization header '" + auth.join(" ") + "' @ " + req.originalUrl);
        // TODO Replace with returning null
        return next();
    }

    var token = auth[1];

    valid_token(token, function (err, user) {
        if(err){
            winston.error("Invalid authorization header '" + auth.join(" ") +"'; "+ err.toString() + " @ " + req.originalUrl);
            // TODO Replace with returning null
            return next();
        }

        req.locals.user  = user;
        req.locals.token = token;

        return next();
    });
};

function clean_user(user) {

    if (!user)
        return null;

    delete user["active"];
    delete user["cell"];
    delete user["created_at"];
    delete user["image"];
    delete user["linkedin"];
    delete user["linkedin_id"];
    delete user["password"];
    delete user["updated_at"];
    delete user["valid_token_timestamp"];

    return user;
}

function get_domain(email) {
    email = email.trim();

    var at_sign = email.indexOf("@");

    if(at_sign === -1)
        return false;

    if (email.split(" ").length !== 1)
        return false;

    var domain = email.substring(++at_sign);

    return domain.indexOf(".") !== -1 ? domain : false;
}