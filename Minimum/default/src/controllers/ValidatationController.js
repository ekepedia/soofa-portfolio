"use strict";

var CompanyService = require("../services/CompanyService"),
    UserService    = require("../services/UserService");

// Company methods
module.exports.find_by_company = function (req, res) {

    CompanyService.find_by_company(req.query.name, function (err, company) {
        if(err)
            return res.json(err);

        return res.json(company.val());
    });
};

module.exports.find_by_domain = function (req, res) {

    CompanyService.find_by_domain(req.query.domain, function (err, company) {
        if(err)
            return res.json(err);

        return res.json(company.val());
    });
};
// END Company methods

// User methods
module.exports.find_by_username = function (req, res) {

    UserService.find_by_username(req.query.username, function (err, user) {
        if(err)
            return res.json(err);

        return res.json(user.val());
    });
};
// END user methods