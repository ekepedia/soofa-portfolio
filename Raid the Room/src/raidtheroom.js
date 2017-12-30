"use strict";

// Require environmental variables
require('dotenv').config();

// Load modules
var async       = require("async"),
    app         = require("express")(),
    body_parser = require("body-parser");

// Start SQL
log_progress("Loading initializers");
require("./initializers/knex");

// Configure express
log_progress("Configuring express");

app.enable('trust proxy');

app.set('view engine', 'ejs');
app.set('views', './src/views');

app.use(require('express').static(__dirname + '/public'));

app.use(body_parser.json({limit: '10mb'}));
app.use(body_parser.urlencoded({ limit: '10mb', extended: true }));

// Routing
app.get("*", function (req, res) {
    res.render("dashboard");
});

// Start HTTP server
log_progress("Starting HTTP server");

var port = process.env.PORT || 3003;

app.listen(port, function () {
    console.log("Listening on port " + port);
});

function log_progress(message) {
    console.log("---------------");
    console.log(message);
    console.log("---------------");
}