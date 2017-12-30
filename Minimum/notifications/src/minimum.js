"use strict";

var winston = require('winston');
winston.level = 'debug';

// Require environmental variables
require('dotenv').config();
var async = require("async");

// Run all the process that need to happen before the app is started
log_progress("Loading initializers");

var initializers = require("./initializers/initializers");

initializers.forEach(function (i) {
    require("./initializers/initializers/" + i.initializer);
    winston.info(i.name + " initialized");
});

// Configure express
log_progress("Configuring express");

var app         = require("express")(),
    body_parser = require("body-parser");

app.enable('trust proxy');

app.set('view engine', 'ejs');
app.set('views', './src/views');

app.use(require('express').static(__dirname + '/public'));

app.use(body_parser.json({limit: '10mb'}));
app.use(body_parser.urlencoded({ limit: '10mb',extended: true }));

// Require each route

function log_progress(message) {
    console.log("---------------");
    console.log(message);
    console.log("---------------");
}

winston.log("debug", "ENVIRONMENT: " + process.env.ENVIORMENT);
winston.log("debug", "NODE ENVIRONMENT: " + process.env.NODE_ENV);
winston.log("debug", "TIMEZONE OFFSET: " + new Date().getTimezoneOffset());
winston.log("debug", "UTC HOUR: " + new Date().getUTCHours());

// Start managers
log_progress("Loading managers");

setTimeout(function (args) {
    var managers = require("./managers/managers");

    async.eachSeries(managers, function (m, cb) {
        var Manager = require("./managers/managers/"+m.manager);
        new Manager(function (err) {
            if (err) winston.error(err);
            winston.info(m.name + " initialized");
            cb(err);
        });
    }, function (err) {
        if (err) winston.error(err);
        winston.info("Managers done");
    });
}, 1000);

// CRON JOBS

var cron = require("./cron");