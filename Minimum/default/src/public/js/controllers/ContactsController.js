"use strict";

minimum_dashboard

    .config(function($routeProvider) {

        $routeProvider

            .when('/admin/contacts', {
                templateUrl : 'pages/contacts/index.html',
                controller:   'ContactController'
            })

            .when('/admin/contacts/edit/:user_id', {
                templateUrl : 'pages/contacts/edit.html',
                controller:   'ContactController'
            })
    })

    .controller('ContactController', function($scope, $http, $routeParams, $location, $timeout, DTOptionsBuilder, contacts, users) {

        // Dashboard
        $scope.dtOptions = DTOptionsBuilder.newOptions()
            .withDisplayLength(20)
            .withOption('bLengthChange', false);

        contacts.get_contacts(function (contacts) {
            console.log(contacts);
        });

        function load_contacts() {
            $http.get('/v0.0/contacts/'+ $routeParams.user_id).then(function(data){
                var keys = _.keys(data.data.data.contacts);
                $scope.pcontacts = [];

                users.get_users(function (data2) {
                    var keys2 = _.keys(data2);
                    $scope.pusers = [];
                    var count = 0;

                    keys.forEach(function (key) {
                        $scope.pcontacts.push([key, data.data.data.contacts[key]]);

                        keys2.splice(keys2.indexOf(key),1);

                        count++;

                        if(count === keys.length)
                            $scope.contacts = $scope.pcontacts;
                    });

                    count = 0;

                    keys2.forEach(function (key) {
                        $scope.pusers.push([key, data2[key]]);
                        count++;
                        if(count === keys2.length)
                            $scope.users = $scope.pusers;
                    });
                });


            });
        }

        load_contacts();

        $scope.remove_contact = function (contact_id) {
            $http.post('/admin/api/contacts/remove/', {
                user_id: $routeParams.user_id,
                contact_id: contact_id
            }).then(function (data) {
                if(data.data === true)
                    load_contacts();
            });
        };

        $scope.add_contact = function (contact_id) {
            $http.post('/admin/api/contacts/add/', {
                user_id: $routeParams.user_id,
                contact_id: contact_id
            }).then(function (data) {
                if(data.data === true)
                    load_contacts();
            });
        };

        $http.get('/admin/api/users/'+ $routeParams.user_id).then(function(data){
            $scope.user = data.data;
        });

        if(!$routeParams.user_id){
            contacts.get_contacts(function (data) {
                $scope.dtOptions = DTOptionsBuilder.newOptions()
                    .withDisplayLength(10)
                    .withOption('bLengthChange', false);

                if($location.$$path === "/admin/contacts"){
                    $timeout(function(){
                        $scope.contacts = _.values(data);
                        $('#table').fadeIn("medium");
                        $('.loading').fadeOut("medium");
                    });
                }
            });

        }


        // END Dashboard

        // Edit Company

        $scope.update = function () {
            //Take the first selected file
            var submission = new FormData();

            submission.append("logo",   $scope.uploaded_image);
            submission.append("name",   $scope.name);
            submission.append("domain", $scope.domain);

            $http.post('/admin/api/companies/edit/'+$scope.company_id, submission, {
                withCredentials: true,
                headers: {'Content-Type': undefined },
                transformRequest: angular.identity
            }).then(function (data) {
                console.log(data.data);
                $location.path("/admin/companies");
            });
        };
        // END Edit Company

        $scope.pretty = function (date) {
            return moment(date).format("MM/DD/YY")
        };

        $scope.count = function (obj) {
            if (!obj)
                return 0;
            return _.keys(obj) ? _.keys(obj).length : 0;
        };

        $scope.valid_company = function () {

            $scope.company_is_valid = false;

            if (!$scope.name) return;

            $http.get('/validate/companies?name=' + $scope.name).then(function(data){

                if(!data.data || _.keys(data.data).length === 0) return $scope.company_is_valid = true;

                var company_id =  data.data[_.keys(data.data)[0]].company_id;

                if($routeParams.company_id === company_id) $scope.company_is_valid = true;

            });

        };

        $scope.valid_domain = function () {

            $scope.domain_is_valid = false;

            if (!$scope.domain) return;

            $http.get('/validate/companies?domain=' + $scope.domain).then(function(data){

                if(!data.data || _.keys(data.data).length === 0) return $scope.domain_is_valid = true;

                var company_id =  data.data[_.keys(data.data)[0]].company_id;

                if($routeParams.company_id === company_id) $scope.domain_is_valid = true;

            });

        };
    });