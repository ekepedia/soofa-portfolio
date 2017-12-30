// Modules ======================================================================
var express  = require('express'),
    app      = express(),
    config   = require('./config'),
    simpledb = require('mongoose-simpledb'),
    flash    = require('connect-flash'),
    passport = require('passport'),
    aws      = require('aws-sdk');
// End Modules ==================================================================

app.set('view engine', 'ejs');

aws.config.update({
    accessKeyId: "AKIAJEIJ7BVY3346RY6A",
    secretAccessKey: "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"
});

app.use(require('express').static(__dirname + '/public'));

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({ limit: '10mb',extended: true }));
app.use(require('cookie-parser')());
app.use(flash());

// Connections ===================================================================
simpledb.init({
    connectionString: config.database.mongoUri
}, function (err) {
    if(err){
        console.log(err);
    } else {
        console.log("MongoDB Database connected");

        require('./passport')(passport);

        app.use(require('express-session')({ secret: 'bostontop20' }));
        app.use(passport.initialize());
        app.use(passport.session());

        // Routes ======================================
        var testFolder = './routes/';
        var fs = require('fs');

        fs.readdir(testFolder, function(err, files) {

            var admin = require('./emailer').admin;

            files.forEach(function (file) {
                file = file.replace(".js","");
                require("./routes/"+file)(app, passport, admin);
                console.log("Loaded /" + file + " route");
            });

            // Single Page App
            app.get("*", function (req, res) {
                res.render('index');
            });
            // End Routes ==================================
        });

    }
});


app.listen((process.env.PORT || 4000), function () {
    console.log('App listening on port ', (process.env.PORT || 4000));

});
// End Connections ===================================================================