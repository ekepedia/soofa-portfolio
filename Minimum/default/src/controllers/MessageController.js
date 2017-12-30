"use strict";
var MessageService      = require("../services/MessageService");
var ConversationService = require("../services/ConversationService");

var MySQLService = require("../services/MySQLService");

var Errors = require("../helpers/Errors");

module.exports.all = function (req, res) {

    if(req.query.deep === "true") {
        if(req.query.group_id) {
            MySQLService.group_conversation_deep(req.query.group_id, 4, function (err, populated_messages) {
                if(err)
                    return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));

                return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                    messages: populated_messages
                });
            });
        }
    } else if(req.query.sender_id && req.query.recipient_id) {

        var limit = req.query.limit || 4;

        MySQLService.one_conversation(req.query.recipient_id, req.query.sender_id, limit, function (err, populated_messages) {
            if(err)
                return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));

            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                messages: populated_messages
            });
        });
    } else if(req.query.recipient_id && req.query.unread) {
        MySQLService.populate_unwatched_fast(req.query.recipient_id, 4, function (err, populated_messages) {
            if(err)
                return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));

            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                messages: populated_messages
            });
        });
    }  else if(req.query.recipient_id && req.query.self === "false") {
        MySQLService.all_received_conversations(req.query.recipient_id, 4, function (err, populated_messages) {
            if(err)
                return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));

            return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                messages: populated_messages
            });
        });
    }  else if(req.query.recipient_id) {
        if(req.query.normalized === "true") {
            MySQLService.all_conversations(req.query.recipient_id, 4, function (err, populated_messages) {
                if(err)
                    return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));

                return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                    messages: populated_messages
                });
            });
        } else {
            ConversationService.populate_all(req.query.recipient_id, function (err, populated_messages) {

                if(err)
                    return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));

                return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                    messages: populated_messages
                });

            });
        }
    } else if(req.query.group_id) {

        var limit = req.query.limit || 4;

         MySQLService.group_conversation(req.query.group_id, limit, function (err, populated_messages) {
             if(err)
                return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));

             return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
                 messages: populated_messages
             });
         });
    } else {
        return Errors.RESPOND_WITH_ERROR(res, Errors.MISSING_FIELDS());
    }
    /*MessageService.getAll(function (err, messages) {
        if(err)
            return res.json(err);

        return res.json(messages);
    })*/
};

module.exports.one = function (req, res) {
    MessageService.getOne(req.params.message_id, function (err, message) {
        if(err)
            return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            message: message
        });
    })
};

module.exports.watch_message = function (req, res) {

    req.body = (typeof req.body !== 'string') ? req.body : JSON.parse(req.body);

    MessageService.watch_message(req.params.message_id, req.body, function (err) {
        if(err){
            return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));
        }

        return Errors.RESPOND_WITH_SUCCESS(res);
    })
};

module.exports.deliver_message = function (req, res) {

    req.body = (typeof req.body !== 'string') ? req.body : JSON.parse(req.body);

    MessageService.deliver_message(req.params.message_id, req.body, function (err) {
        if(err){
            return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));
        }

        return Errors.RESPOND_WITH_SUCCESS(res);
    })
};

module.exports.new = function (req, res) {

    req.body = (typeof req.body !== 'string') ? req.body : JSON.parse(req.body);

    MessageService.new(req.body, function (err, message_id) {
        if(err){
            return Errors.RESPOND_WITH_ERROR(res, Errors.API_ERROR(err));
        }

        return Errors.RESPOND_WITH_SUCCESS_AND_DATA(res, {
            message_id: message_id
        });
    })
};