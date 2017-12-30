var _ = require('underscore');

module.exports = function (app, passport, admin) {

    app.post("/email/contact/", function (req, res) {

        var mailData = {
            from: '"Admin" <admin@bostontop20.com>',
            to: "info@bostontop20.com, eke@mit.edu",
            subject: "New Contact Request" + (req.body.subject ? " | " + req.body.subject : ""),
            text: "Name: " + req.body.name + "\nEmail: " + req.body.email + "\nMessage: \n\n" + req.body.body
        };

        admin.sendMail(mailData, function (err, info) {
            console.log(err, info.response, "Email sent to: eke@mit.edu");
        });

        res.json({
            success: true
        });

    });

};