"use strict";
var async = require("async");

// Constructor
var NLU = function (done) {
    done = (typeof done === 'function') ? done : function() {};

    return done(null);

};
// END Constructor

var ms                             = require("../../models/Messages"),
    slack                          = require("../../services/SlackService"),
    NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

var natural_language_understanding = new NaturalLanguageUnderstandingV1({
    'username':     process.env.IBM_NLU_USERNAME,
    'password':     process.env.IBM_NLU_PASSWORD,
    'version_date': '2017-02-27'
});

var AYLIENTextAPI = require('aylien_textapi');
var aylien        = new AYLIENTextAPI({
    application_id:  process.env.AYLIEN_APP_ID,
    application_key: process.env.AYLIEN_API_KEY
});

var indico    = require('indico.io');
indico.apiKey =  process.env.INDICO_API_KEY;

var logError = function(err) {
    // console.log(err);
};

NLU.prototype._listen_to_new_messages = function () {

    var self = this;

    ms.reference.limitToLast(1).on("child_added", function (m) {

        self.process_message(m);

    });
};

module.exports = NLU;

function run_watson(message_id, text, cb) {

    if(!text.val())
        return cb(null, null);

    var parameters = {
        'text': text.val(),
        'features': {
            'entities': {
                'limit': 5
            },
            'keywords': {
                'limit': 5
            },
            'categories': {
                'limit': 5
            }
        }
    };

    natural_language_understanding.analyze(parameters, function(err, response) {
        if (err)
            return cb(null, null);

        if(!response)
            return cb(null, null);

        if(response && response.keywords)
            ms.reference.child(message_id).child("keywords").set(response.keywords);

        if(response && response.entities)
            ms.reference.child(message_id).child("entities").set(response.entities);

        if(response && response.categories)
            ms.reference.child(message_id).child("categories").set(response.categories);

        cb(null, response);
    });
}

function run_indico(message_id, text, cb) {

    if(!text.val())
        return cb(null, null);

    indico.keywords(text.val(), {version: 2})
        .then(function (response) {

            if(!response)
                return cb(null, null);

            ms.reference.child(message_id).child("indico").child("keywords").set(response);

            cb(null, response);

        })
        .catch(function () {
            return cb(null, null);
        });
}

function run_aylien(message_id, text, cb) {

    if(!text.val())
        return cb(null, null);

    aylien.entities({text: text.val()}, function (err, response) {

        if(err)
            return cb(null, null);

        if(!response)
            return cb(null, null);

        ms.reference.child(message_id).child("aylien").child("concepts").set(response);

        cb(null, response);

    });
}

NLU.prototype.process_message = function(m, callback) {

    if(!m || !m.key || !m.val || !m.val())
        return false;

    callback = (typeof callback === 'function') ? callback : function() {};

    ms.reference.child(m.key).child("video_status").on("value", function (status) {
        if(status.val() === "uploading"){

            console.time("Total time to run watson, aylien, and indico for $"+m.key);

            ms.reference.child(m.key).child("speech_text").once("value", function (text) {
                if(!text.val())
                    return;

                var message_id = m.key;

                async.parallel({
                    watson: function (cb) {
                        run_watson(message_id, text, cb);
                    },
                    indico: function (cb) {
                        run_indico(message_id, text, cb);
                    },
                    aylien: function (cb) {
                        run_aylien(message_id, text, cb);
                    }
                }, function (err, results) {
                    // if(err) return logError(err);

                    console.timeEnd("Total time to run watson, aylien, and indico for $"+m.key);

                    slack.notify(message_id, text.val(), results);
                });

            });
        }
    });
}

function load_data() {
    var data = require("../../../nlp/data/tony-norbert");
    var as   = require("../../services/AudioService");
    var async = require("async");

    var ms = require("../../models/Messages");

    /*
     async.mapLimit(data.data, 3, function (message, cb) {
     as.analyze(message.public_id, function (err, text) {
     message.speech_text = text;
     message.video_status = "uploading";
     console.log(new Date(message.created_at), text);
     ms.reference.push(message);
     cb(null, message);
     });
     }, function (err, messages) {
     console.log(err, messages);
     });
     */
}

