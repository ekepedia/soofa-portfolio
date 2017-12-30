"use strict";

var mysql           = require('mysql2'),
    url             = require('url'),
    SocksConnection = require('socksjs');

var remote_options = {
    host: process.env.SQL_HOST,
    port: 3306
};

var proxy    = url.parse(process.env.QUOTAGUARDSTATIC_URL),
    auth     = proxy.auth,
    username = auth.split(':')[0],
    pass     = auth.split(':')[1];

var sock_options = {
    host: proxy.hostname,
    port: 1080,
    user: username,
    pass: pass
};

var sockConn = new SocksConnection(remote_options, sock_options);

var dbConnection = mysql.createConnection({
    user:          process.env.SQL_USER,
    password:      process.env.SQL_PASSWORD,
    database:      process.env.SQL_DATABASE,
    stream:        sockConn
});


function connect() {
    dbConnection.query('SELECT 1+1 as test1;', function(err, rows, fields) {
        if (err) throw err;

    });
}

connect();

dbConnection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        connect();
    } else {
        throw err;
    }
});


