"use strict";

var admin = require("firebase-admin");

// Fetch the service account key JSON file contents
var serviceAccount = process.env.ENVIORMENT === "dev" ?
    require("../../config/dev-firebaseauth.json") : require("../../config/firebaseauth.json")
;

var URL = process.env.ENVIORMENT === "dev" ? process.env.DEV_FIREBASE_URL : process.env.FIREBASE_URL;

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: URL
});