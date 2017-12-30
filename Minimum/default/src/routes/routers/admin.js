"use strict";

var express = require('express');

var router  = express.Router();

var multer  = require('multer');
var upload  = multer({ dest: 'uploads/' });

// Import Controller
var DashboardController = require('../../controllers/DashboardController');
var AuthService         = require("../../services/AuthService");

router.use('/api/*', AuthService.valid_token_middleware);

router.use('/api/*', function (req, res, next) {
    if(!req.locals || !req.locals.user || !req.locals.token)
        return res.status(401).json(null);
    return next();
});

router.post('/api/companies/new', upload.single('logo'), function (req, res) {
    DashboardController.new_company(req, res);
});

router.post('/api/companies/edit/:company_id', upload.single('logo'), function (req, res) {
    DashboardController.edit_company(req, res);
});

router.get('/api/companies/', function (req, res) {
    DashboardController.get_all_companies(req, res);
});

router.get('/api/companies/:company_id', function (req, res) {
    DashboardController.get_one_company(req, res);
});

router.get('/api/users/', function (req, res) {
    DashboardController.get_all_users(req, res);
});

router.get('/api/users/:user_id', function (req, res) {
    DashboardController.get_one_user(req, res);
});

router.get('/api/groups/', function (req, res) {
    DashboardController.get_all_groups(req, res);
});

router.post('/api/users/new', upload.single('image'), function (req, res) {
    DashboardController.new_user(req, res);
});

router.delete('/api/users/:user_id', function (req, res) {
    DashboardController.delete_user(req, res);
});

router.post('/api/users/edit/:user_id', upload.single('image'), function (req, res) {
    DashboardController.edit_user(req, res);
});

router.get('/api/messages/all', function (req, res) {
    DashboardController.message_stats(req, res);
});

router.get('/api/messages/stats/:user_id', function (req, res) {
    DashboardController.message_stats_single(req, res);
});

router.get('/api/conversations/average/:user_id', function (req, res) {
    DashboardController.averages(req, res);
});

router.get('/api/conversations/all/:user_id', function (req, res) {
    DashboardController.conversations(req, res);
});

router.get('/api/contacts/all', function (req, res) {
    DashboardController.contacts_stats(req, res);
});

router.get('/api/messages', function (req, res) {
    DashboardController.all_messages(req, res);
});

router.post('/api/contacts/remove', function (req, res) {
    DashboardController.remove_contact(req, res);
});

router.post('/api/contacts/add', function (req, res) {
    DashboardController.add_contact(req, res);
});


router.get('*', function (req, res) {
    res.render('dashboard');
});


module.exports = router;