"use strict";

var jwt       = require("jsonwebtoken");
var User      = require("../models/Users");
var Companies = require("../models/Companies");
var bcrypt    = require("bcrypt");
var _         = require("lodash");
var winston   = require("winston");

var Errors      = require("../helpers/Errors");
var UserService = require("../services/UserService");

var TRIE        = require("../managers/managers/TRIE");

TRIE = new TRIE(false, true);

var admins = ["7","34","8","20"];

module.exports.register = function (company_id, name, email, photo_url, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    if(!company_id || !name || !email || !photo_url)
        return callback(Errors.MISSING_FIELDS());

    email = email.toLowerCase().trim();
    var username = email;

    User.find_by_email(email, function (err, user) {
        if(err)
            return callback(Errors.API_ERROR(err));

        if(user && user.val && user.val())
            return callback(Errors.DUPLICATE_SIGN_UP());

        UserService.new({
            company_id: company_id,
            name:       name,
            email:      email,
            photo_url:  photo_url,
            username:   username
        }, function (err) {
            return callback(err);
        })
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

        if(user && user.val && user.val()) {
            user = user.val()[_.keys(user.val())[0]];

            return callback(null, {
                valid_email: true,
                registered:  true,
                password:    user.password !== null && user.password !== undefined,
                company_id:  user.company_id,
                user:        clean_user(user)
            });

        }

        var domain = get_domain(email);

        if(!domain)
            return callback(null, {
                valid_email: false,
                registered:  false,
                password:    false,
                company_id:  null,
                user:        null
            });

        Companies.find_by_domain(domain, function (err, company) {
            if(err)
                return callback(Errors.API_ERROR(err));

            if(company && company.val && company.val()) {
                company = company.val()[_.keys(company.val())[0]];

                return callback(null, {
                    valid_email: true,
                    registered:  false,
                    password:    false,
                    company_id:  company.company_id,
                    user:        null
                });
            }

            var current_date = new Date().getTime();

            Companies.new({
                name:       domain,
                domain:     domain,
                created_at: current_date,
                photo_url:  process.env.FEEDBACK_AND_SUPPORT_LOGO
            }, function (err, company) {
                if(err)
                    return callback(Errors.API_ERROR(err));

                return callback(null, {
                    valid_email: true,
                    registered:  false,
                    password:    false,
                    company_id:  company.company_id,
                    user:        null
                });
            });

        });

    });
};


module.exports.login = login;

function login (email, password, callback) {

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
    var at_sign = email.indexOf("@");

    if(at_sign === -1)
        return false;

    var domain = email.substring(++at_sign);

    if(domains.indexOf(domain) !== -1)
        return false;

    return domain.indexOf(".") !== -1 ? domain : false;
}

var domains = [
    /* Default domains included */
    "aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
    "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
    "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk",

    /* Other global domains */
    "email.com", "games.com" /* AOL */, "gmx.net", "hush.com", "hushmail.com", "icloud.com", "inbox.com",
    "lavabit.com", "love.com" /* AOL */, "outlook.com", "pobox.com", "rocketmail.com" /* Yahoo */,
    "safe-mail.net", "wow.com" /* AOL */, "ygm.com" /* AOL */, "ymail.com" /* Yahoo */, "zoho.com", "fastmail.fm",
    "yandex.com","iname.com",

    /* United States ISP domains */
    "bellsouth.net", "charter.net", "cox.net", "earthlink.net", "juno.com",

    /* British ISP domains */
    "btinternet.com", "virginmedia.com", "blueyonder.co.uk", "freeserve.co.uk", "live.co.uk",
    "ntlworld.com", "o2.co.uk", "orange.net", "sky.com", "talktalk.co.uk", "tiscali.co.uk",
    "virgin.net", "wanadoo.co.uk", "bt.com",

    /* Domains used in Asia */
    "sina.com", "qq.com", "naver.com", "hanmail.net", "daum.net", "nate.com", "yahoo.co.jp", "yahoo.co.kr", "yahoo.co.id", "yahoo.co.in", "yahoo.com.sg", "yahoo.com.ph",

    /* French ISP domains */
    "hotmail.fr", "live.fr", "laposte.net", "yahoo.fr", "wanadoo.fr", "orange.fr", "gmx.fr", "sfr.fr", "neuf.fr", "free.fr",

    /* German ISP domains */
    "gmx.de", "hotmail.de", "live.de", "online.de", "t-online.de" /* T-Mobile */, "web.de", "yahoo.de",

    /* Italian ISP domains */
    "libero.it", "virgilio.it", "hotmail.it", "aol.it", "tiscali.it", "alice.it", "live.it", "yahoo.it", "email.it", "tin.it", "poste.it", "teletu.it",

    /* Russian ISP domains */
    "mail.ru", "rambler.ru", "yandex.ru", "ya.ru", "list.ru",

    /* Belgian ISP domains */
    "hotmail.be", "live.be", "skynet.be", "voo.be", "tvcablenet.be", "telenet.be",

    /* Argentinian ISP domains */
    "hotmail.com.ar", "live.com.ar", "yahoo.com.ar", "fibertel.com.ar", "speedy.com.ar", "arnet.com.ar",

    /* Domains used in Mexico */
    "yahoo.com.mx", "live.com.mx", "hotmail.es", "hotmail.com.mx", "prodigy.net.mx",

    /* Domains used in Brazil */
    "yahoo.com.br", "hotmail.com.br", "outlook.com.br", "uol.com.br", "bol.com.br", "terra.com.br", "ig.com.br", "itelefonica.com.br", "r7.com", "zipmail.com.br", "globo.com", "globomail.com", "oi.com.br"
];