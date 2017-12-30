"use strict";

minimum_dashboard

    .config(function($routeProvider) {

        $routeProvider

            .when('/admin/companies', {
                templateUrl : 'pages/companies/index.html',
                controller: 'CompanyController',
                // resolve: { loggedin: loggedIn }
            })

            .when('/admin/companies/view/:company_id', {
                templateUrl : 'pages/companies/company.html',
                controller: 'CompanyController',
                // resolve: { loggedin: loggedIn }
            })

            .when('/admin/companies/new', {
                templateUrl : 'pages/companies/new.html',
                controller: 'CompanyController',
                // resolve: { loggedin: loggedIn }
            })

            .when('/admin/companies/edit/:company_id', {
                templateUrl : 'pages/companies/edit.html',
                controller: 'CompanyController',
                // resolve: { loggedin: loggedIn }
            })
    })

    .controller('CompanyController', function($scope, $http, $routeParams, $location, $timeout, DTOptionsBuilder, companies) {

        // Dashboard
        $scope.dtOptions = DTOptionsBuilder.newOptions()
            .withDisplayLength(20)
            .withOption('bLengthChange', false);

        companies.get_companies(function (data) {
            if($location.$$path === "/admin/companies"){
                $timeout(function(){
                    $scope.companies = _.values(data);
                    $('#table').fadeIn("medium");
                    $('.loading').fadeOut("medium");
                });
            }
        });
        // END Dashboard

        // New Company

        $scope.uploadFile = function(files) {
            $scope.uploaded_image = files[0];
        };

        $scope.save = function () {
            //Take the first selected file
            var submission = new FormData();

            submission.append("logo",   $scope.uploaded_image);
            submission.append("name",   $scope.name);
            submission.append("domain", $scope.domain);

            $http.post('/admin/api/companies/new', submission, {
                withCredentials: true,
                headers: {'Content-Type': undefined },
                transformRequest: angular.identity
            }).then(function (data) {
                $location.path("/admin/companies");
            });
        };
        // END New Company

        // Edit Company
        if($routeParams.company_id){
            $scope.company_id = $routeParams.company_id;

            $http.get('/admin/api/companies/' + $scope.company_id).then(function(data){

                if(data.data) {
                    var company = data.data;

                    $scope.users    = company.users;
                    $scope.members  = _.values(company.users);

                    $scope.name   = company.name;
                    $scope.domain = company.domain;
                    $scope.logo   = company.photo_url;

                    $scope.valid_domain();
                    $scope.valid_company();

                }

            });
        }

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
            return moment(date).format("MM/DD")
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