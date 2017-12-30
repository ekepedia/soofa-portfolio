"use strict";

var async   = require('async');
var _       = require('lodash');

var MySQLService = require("../services/MySQLService");

var Errors = require("../helpers/Errors");

module.exports.add_association_request = function (req, res) {

    var associater_id = req.body.associater_id,
        associatee_id = req.body.associatee_id,
        type          = req.body.type,
        cost          = parseFloat(req.body.cost) || 0;

    if(!associater_id || !associatee_id || !type)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    if (type.toLowerCase() === "subscribe")
        return MySQLService.add_association(associater_id, associatee_id, type, cost, function (err, association_request) {

            if(err){
                return Errors.RESPOND_WITH_ERROR(res, err);
            }

            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                association_request: association_request
            });

        });

    MySQLService.add_association_request(associater_id, associatee_id, type, cost, function (err, association_request) {

        if(err){
            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            association_request: association_request
        });

    });

};

module.exports.remove_association_request = function (req, res) {


    var associater_id = req.body.associater_id,
        associatee_id = req.body.associatee_id,
        type          = req.body.type,
        cost          = parseFloat(req.body.cost) || 0;

    if(!associater_id || !associatee_id || !type)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    MySQLService.remove_association_request(associater_id, associatee_id, type, cost, function (err, association_request) {

        if(err){
            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            association_request: association_request
        });

    });

};

module.exports.edit_association_request = function (req, res) {


    var associater_id = req.body.associater_id,
        associatee_id = req.body.associatee_id,
        type          = req.body.type,
        accept        = req.body.accept,
        cost          = parseFloat(req.body.cost) || 0;

    if(!associater_id || !associatee_id || !type || (accept === undefined || accept === null))
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    if ( accept === "false") {
        MySQLService.deny_association_request(associater_id, associatee_id, type, cost, function (err, association_request) {

            if(err){
                return Errors.RESPOND_WITH_ERROR(res, err);
            }

            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                association_request: association_request
            });

        });
    } else {
        MySQLService.remove_association_request(associater_id, associatee_id, type, cost, function (err) {

            if(err){
                return Errors.RESPOND_WITH_ERROR(res, err);
            }

            MySQLService.add_association(associater_id, associatee_id, type, cost, function (err, association) {

                if(err){
                    return Errors.RESPOND_WITH_ERROR(res, err);
                }

                return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                    association: association
                });

            });

        });
    }

};

module.exports.get_association_requests = function (req, res) {

    var associatee_id = req.query.associatee_id,
        type          = req.query.type;

    if(!associatee_id || !type)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    MySQLService.get_association_requests(associatee_id, type, function (err, association_requests) {

        if(err){
            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            association_requests: association_requests
        });

    });

};


module.exports.get_associations = function (req, res) {


    var associatee_id = req.query.associatee_id,
        associater_id = req.query.associater_id,
        type          = req.query.type;

    if((!associatee_id && !associater_id) || !type)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    if (associatee_id && associater_id) {
        MySQLService.get_associations_received(associatee_id, type, function (err, associations_r) {

            if(err){
                return Errors.RESPOND_WITH_ERROR(res, err);
            }

            MySQLService.get_associations_sent(associater_id, type, function (err, associations_s) {

                if(err){
                    return Errors.RESPOND_WITH_ERROR(res, err);
                }

                return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                    associations: _.merge(associations_r, associations_s)
                });

            });

        });
    } else if (associater_id) {
        MySQLService.get_associations_sent(associater_id, type, function (err, associations) {

            if(err){
                return Errors.RESPOND_WITH_ERROR(res, err);
            }

            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                associations: associations
            });

        });
    } else {
        MySQLService.get_associations_received(associatee_id, type, function (err, associations) {

            if(err){
                return Errors.RESPOND_WITH_ERROR(res, err);
            }

            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                associations: associations
            });

        });
    }

};

module.exports.remove_association = function (req, res) {


    var associater_id = req.body.associater_id,
        associatee_id = req.body.associatee_id,
        type          = req.body.type,
        cost          = parseFloat(req.body.cost) || 0;

    if(!associater_id || !associatee_id || !type)
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());

    MySQLService.remove_association(associater_id, associatee_id, type, cost, function (err, association) {

        if(err){
            return Errors.RESPOND_WITH_ERROR(res, err);
        }

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            association: association
        });

    });

};