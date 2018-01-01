"use strict";

var aws     = require("aws-sdk"),
    sizeOf  = require("image-size"),
    winston = require("winston"),
    fs      = require("fs");

module.exports.upload = function (file, callback) {

    if(file){

        fs.readFile(file.path, function (err, data) {

            if(!verify_image(file, data))
                return callback("Invalid image");

            var params = {
                Bucket: "minimumvideoupload-deployments-mobilehub-1450667936",
                Key: "images/"+Math.random()+file.originalname,
                ContentType: file.mimetype,
                Body: data,
                ACL: 'public-read'
            };

            var s3 = new aws.S3();

            s3.upload(params, function (perr, pres) {
                if (perr) {
                    winston.error("Error uploading data: ", perr);
                    return callback(perr);
                } else {
                    winston.info("Successfully uploaded data", pres.Location);

                    return callback(null, pres.Location);
                }
            });

        });

    } else {
        return callback("No file");
    }
};

function verify_image(file, data) {
    var dimensions = sizeOf(data);

    if(Math.abs(dimensions.height - dimensions.width) > 100)
        return false;

    if(!file.mimetype.includes("image/jpeg") && !file.mimetype.includes("image/png"))
        return false;

    return file.size*0.00000095367432 < 15;
}