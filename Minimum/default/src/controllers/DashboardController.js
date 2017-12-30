"use strict";

var _ = require("lodash");

var CompanyService      = require("../services/CompanyService"),
    UserService         = require("../services/UserService"),
    ConversationService = require("../services/ConversationService"),
    GroupService        = require("../services/GroupService"),
    MySQLService        = require("../services/MySQLService"),
    ImageService        = require("../services/ImageService");

var Errors = require("../helpers/Errors");

// Company methods
module.exports.get_all_companies  = function (req, res) {
    CompanyService.all(function (err, companies) {
        if(err)
            return res.json(err);

        res.json(companies);
    });

};

module.exports.get_one_company  = function (req, res) {

    CompanyService.one(req.params.company_id, function (err, company) {
        res.json(company);
    });

};

module.exports.averages  = function (req, res) {

    ConversationService.averages(req.params.user_id, function (err, averages) {
        res.json(averages);
    });

};

module.exports.conversations  = function (req, res) {

    ConversationService.conversations(req.params.user_id, function (err, conversations) {
        res.json(conversations);
    });

};

module.exports.get_one_user  = function (req, res) {

    UserService.getOne(req.params.user_id, function (err, user) {

        res.json(user);
    });

};

module.exports.delete_user  = function (req, res) {

    UserService.delete_user(req.params.user_id, function (err) {
        Errors.RESPOND_WITH_SUCCESS(res);
    });

};

module.exports.new_company  = function (req, res) {

    ImageService.upload(req.file, function (err, photo_url) {

        if(err){
            return res.json(err);
        }

        var new_company = _.merge(req.body, {
            photo_url: photo_url,
            created_at: new Date().getTime(),
            updated_at: new Date().getTime()
        });

        CompanyService.new(new_company, function (err, company) {
            res.json(company);
        });

    });

};

module.exports.edit_company = function (req, res) {

    var updated_company = _.merge(req.body, {
        updated_at: new Date().getTime()
    });

    if(!req.file)
        return CompanyService.update(req.params.company_id, updated_company, function (err, company) {
            res.json(company);
        });


    ImageService.upload(req.file, function (err, photo_url) {

        if(err){
            return res.json(err);
        }

        updated_company = _.merge(req.body, {
            photo_url: photo_url
        });

        CompanyService.update(req.params.company_id, updated_company, function (err, company) {
            res.json(company);
        });

    });

};
// END Company methods

// User methods
module.exports.get_all_users = function (req, res) {

    UserService.getAll(function (err, users) {
        res.json(users);
    });

};

module.exports.new_user     = function (req, res) {
    ImageService.upload(req.file, function (err, photo_url) {

        if(err){
            return res.json(err);
        }

        var new_user = _.merge(req.body, {
            photo_url: photo_url,
            created_at: new Date().getTime(),
            updated_at: new Date().getTime()
        });

        UserService.new(new_user, function (err, user) {
            res.json(user);
        });

    });
};

module.exports.edit_user = function (req, res) {

    var updated_user = _.merge(req.body, {
        updated_at: new Date().getTime()
    });

    if(!req.file)
        return UserService.update(req.params.user_id, updated_user, function (err, user) {
            res.json(user);
        });


    ImageService.upload(req.file, function (err, photo_url) {

        if(err){
            return res.json(err);
        }

        updated_user = _.merge(req.body, {
            photo_url: photo_url
        });

        UserService.update(req.params.user_id, updated_user, function (err, user) {
            res.json(user);
        });

    });

};

module.exports.find_by_username = function (req, res) {

    UserService.find_by_username(req.params.username, function (err, user) {
       if(err)
           return res.json(err);

       return res.json(user.val());
    });
};
// END user methods

// Group methods
module.exports.get_all_groups = function (req, res) {

    GroupService.all(function (err, groups) {
        res.json(groups);
    });

};
// END Group methods

// Stat Methods
module.exports.message_stats = function (req, res) {

    MySQLService.message_stats(function (err, stats) {
        res.json(stats);
    });

};

module.exports.contacts_stats = function (req, res) {

    MySQLService.contacts_stats(function (err, stats) {
        res.json(stats);
    });

};

module.exports.message_stats_single = function (req, res) {

    MySQLService.message_stats_single(req.params.user_id, function (err, stats) {
        res.json(stats);
    });

};



module.exports.all_messages = function (req, res) {

    MySQLService.message_count(function (err, count) {
        res.json(count);
    });

};
// END Stat methods

// Contact Methods
module.exports.all_contacts = function (req, res) {

    UserService.get_all_contacts(function (err, contacts) {
        res.json(contacts);
    });

};

module.exports.remove_contact = function (req, res) {

    UserService.remove_contact(req.body.user_id, req.body.contact_id, function (err) {
        if(err)
            return res.json(err);

        return res.json(true);
    });

};

module.exports.add_contact = function (req, res) {

    UserService.add_contact(req.body.user_id, req.body.contact_id, function (err) {
        if(err)
            return res.json(err);

        return res.json(true);
    });

};
// END Contact Methods