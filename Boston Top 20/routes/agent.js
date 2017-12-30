var Testimonial = require("mongoose-simpledb").db.Testimonial;
var multer         = require('multer');
var upload      = multer({ dest: 'uploads/' });
var fs             = require('fs');
var aws            = require('aws-sdk');

module.exports = function (app, passport) {

    app.post("/api/testimonial/new", function (req, res) {
        var t = new Testimonial();

        t.agentId = req.body.agentId;
        t.name = req.body.name;
        t.email = req.body.email;
        t.date = req.body.date;
        t.text = req.body.text;
        t.approved = false;

        t.save(function (err) {
            res.json({
                success: true
            });
        });

    });

    app.get("/api/testimonials", function (req, res) {
        Testimonial.find({approved: false}).populate("agentId").exec(function (err, tests) {
            if(err)
                return res.json({
                    success: false,
                    err: err
                });

            return res.json({
                success: true,
                testimonials: tests
            });
        })

    });

    app.get("/api/testimonials/:id", function (req, res) {
        Testimonial.find({approved: true, agentId: req.params.id}).exec(function (err, tests) {
            if(err)
                return res.json({
                    success: false,
                    err: err
                });

            return res.json({
                success: true,
                testimonials: tests
            });
        })
    });

    app.get("/api/me", function (req, res) {
        return res.json({
            user: req.user
        })
    });

    app.post("/api/me/about", function (req, res) {
        if(req.user){
            req.user.about = req.body.about;
            req.user.save();
        }

        return res.json({
            user: req.user
        })
    });

    app.get("/api/testimonial/approve/:id", function (req, res) {
        Testimonial.findOne({_id: req.params.id})
            .exec(function (err,t) {
                if(err)
                    return res.json({success: false, err:err});

                if(!t)
                    return res.json({success: false});

                t.approved = true;

                t.save(function () {
                    return res.json({success: true});
                });
            });
    });


    app.post('/signup', function(req, res, next) {
        passport.authenticate('local-signup', function(err, user, info) {
            if (err) { return error(res, err); }
            if (!user) { return res.json({
                success: false,
                message: req.flash('signupMessage'),
                fields: req.body
            }); }
            req.logIn(user, function(err) {

                if (err) { error(res, err); }

                return res.json({
                    success: true,
                    user: user
                });
            });
        })(req, res, next);
    });

    app.post('/login', function(req, res, next) {
        passport.authenticate('local-login', function(err, user, info) {
            if (err) { return next(err); }

            if (!user)
                return res.json({
                    success: false,
                    message: req.flash("loginMessage")
                });

            req.logIn(user, function(err) {

                if (err) { return next(err); }
                res.json({
                    success: true,
                    user: user
                });
            });
        })(req, res, next);
    });

    app.get('/logout', function(req, res) {
        req.logout();
        req.session.destroy(function (err) {

            req.session = null;

            return res.json({
                user: null
            });
        });

    });

    app.post('/me/image', upload.single('image'), function (req, res) {

        if(req.file){

            if(!req.file.mimetype.includes("image/jpeg") && !req.file.mimetype.includes("image/png"))
                return message(req, res, "Must upload a jpeg or png image");

            if(req.file.size*0.00000095367432 > 10)
                return message(req, res, "Must upload an image smaller than 10 MB");

            fs.readFile(req.file.path, function (err, data) {

                var sizeOf = require('image-size');
                var dimensions = sizeOf(data);

                // if(Math.abs(dimensions.height - dimensions.width) > 5)
                //    return message(req, res, "You must upload a square image");

                var params = {
                    Bucket: "bostontop20",
                    Key: "public/img/user/"+req.file.originalname,
                    ContentType: req.file.mimetype,
                    Body: data,
                    ACL: 'public-read'
                };

                var s3 = new aws.S3();

                s3.upload(params, function (perr, pres) {
                    if (perr) {
                        console.log("Error uploading data: ", perr);
                        return message(req, res, perr);
                    } else {
                        console.log("Successfully uploaded data", pres);

                        if(!req.user)
                            return message(req, res, "Not logged in");

                        req.user.url = pres.Location;

                        req.user.save(function (err) {
                            if(err)
                                return message(req, res, err);

                            return message(req, res, pres.Location, true)
                        });
                    }
                });

            });

        } else {
            message(req, res, "No file");
        }

    });
};

function message (req, res, message, success) {

    if(!success) success = false;

    res.json({success: success, message: message});
}