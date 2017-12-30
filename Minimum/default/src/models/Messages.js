"use strict";

var admin    = require("firebase-admin"),
    Messages = admin.database().ref("Messages");

module.exports.findById = function (id, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Messages.child(id).once("value", function(data) {
        callback(null, data);
    });

};

module.exports.all = function (callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Messages.once("value", function(data) {
        callback(null, data);
    });

};

module.exports.delete = function (id, updates, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Messages.child(id).set(null);
};

module.exports.update = function (id, updates, callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    Messages.child(id).update(updates, callback);
};

module.exports.new = function (data,  callback) {

    callback = (typeof callback === 'function') ? callback : function() {};

    data.created_at = parseInt(data.created_at);

    var key = Messages.push(data).key;

    callback(null, key);
};


module.exports.new_object = function (in_user_id, in_title, in_text) {

    var Message = function (user_id, title, text) {
        this.key        = "system-message";
        this.user_id    = user_id;
        this.title      = title;
        this.text       = text;
        this.created_at = new Date().getTime();
    };

    Message.prototype.val = function () {
        var self = this;

        return {
            speech_text:  self.text,
            recipient_id: self.user_id,
            created_at:   self.created_at,
            sender_id:    "system",
            heading:      self.title
        }
    };

    return new Message(in_user_id, in_title, in_text);
};

module.exports.reference = Messages;
