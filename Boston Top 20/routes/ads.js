var ads = require("../ads/ads");

var _ = require('underscore');

module.exports = function (app) {

    app.get("/api/pictures/:location", function (req, res) {
        var combined_ads = ads.all;

        combined_ads = _.union(ads[req.params.location],combined_ads);

        res.json({
            data: combined_ads
        });
    });

};