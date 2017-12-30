"use strict";

minimum_dashboard

    .config(function($routeProvider) {

        $routeProvider

            .when('/admin/users', {
                templateUrl : 'pages/users/index.html',
                controller: 'UserController',
                // resolve: { loggedin: loggedIn }
            })

            .when('/admin/users/edit/:user_id', {
                templateUrl : 'pages/users/edit.html',
                controller: 'UserController',
                // resolve: { loggedin: loggedIn }
            })

            .when('/admin/users/new', {
                templateUrl : 'pages/users/new.html',
                controller: 'UserController',
                // resolve: { loggedin: loggedIn }
            });
    })

    .controller('UserController', function($scope, $http, $location, users, $timeout, DTOptionsBuilder, $routeParams) {

        users.get_users(function (data) {
            $scope.dtOptions = DTOptionsBuilder.newOptions()
                .withDisplayLength(20)
                .withOption('bLengthChange', false);

            if($location.$$path === "/admin/users"){
                $timeout(function(){
                    $scope.users = _.values(data);
                    $('#table').fadeIn("medium");
                    $('.loading').fadeOut("medium");
                });
            }
        });


        $http.get('admin/api/companies').then(function(data){

            $scope.companies  = _.values(data.data);
            $scope.company_id = $scope.company_id ? $scope.company_id : $scope.companies[0].company_id;

        });

        // New User
        $scope.uploadFile = function(files) {
            $scope.uploaded_image = files[0];
        };

        $scope.save = function () {
            //Take the first selected file

            var submission = new FormData();

            submission.append("company_id", $scope.company_id);
            submission.append("username",   $scope.username);
            submission.append("name",       $scope.name);
            submission.append("email",      $scope.email);
            submission.append("linkedin_id",   $scope.linkedin_id);
            submission.append("cell",       $scope.cell);
            submission.append("image",      $scope.uploaded_image);

            $http.post('/admin/api/users/new', submission, {
                withCredentials: true,
                headers: {'Content-Type': undefined },
                transformRequest: angular.identity
            }).then(function (data) {
                console.log(data.data);
                users.reload_users();
                $location.path("/admin/users");
            });
        };

        // Edit User
        if($routeParams.user_id){
            $scope.user_id = $routeParams.user_id;
            $http.get('admin/api/users/' + $scope.user_id).then(function(data){

                if(data.data) {
                    var user = data.data;

                    $scope.company_id  = user.company_id;
                    $scope.active      = user.active;
                    $scope.username    = user.username;
                    $scope.name        = user.name;
                    $scope.email       = user.email;
                    $scope.cell        = user.cell;
                    $scope.image       = user.photo_url;
                    $scope.linkedin_id = user.linkedin_id;

                    $scope.valid_username();

                }

            });
        }

        $scope.update = function () {
            //Take the first selected file

            var payload = new FormData();

            payload.append("company_id",  $scope.company_id);
            payload.append("username",    $scope.username);
            payload.append("name",        $scope.name);
            payload.append("email",       $scope.email);
            payload.append("cell",        $scope.cell);
            payload.append("linkedin_id", $scope.linkedin_id);
            payload.append("image",       $scope.uploaded_image);

            $http.post('/admin/api/users/edit/'+$scope.user_id, payload, {
                withCredentials: true,
                headers: {'Content-Type': undefined },
                transformRequest: angular.identity
            }).then(function (data) {
                console.log(data.data);
                users.reload_users();
                $location.path("/admin/users");
            });
        };

        $scope.delete = function () {

            var confirm = window.confirm("Are you sure you want to delete this User?");

            if(confirm) {
                $http.delete('/admin/api/users/'+$scope.user_id, {
                    withCredentials: true,
                    headers: {'Content-Type': undefined },
                    transformRequest: angular.identity
                }).then(function (data) {
                    users.reload_users();
                    $location.path("/admin/users");
                });
            }

        };

        $scope.pretty = function (date) {
            if (date)
                return moment(date).format("MM/DD");
        };

        $scope.valid_username = function () {

            $scope.username_is_valid = false;

            if (!$scope.username) return;

            $http.get('/validate/users?username=' + $scope.username).then(function(data){

                if(!data.data || _.keys(data.data).length === 0) return $scope.username_is_valid = true;

                var user_id =  data.data[_.keys(data.data)[0]].user_id;

                if($routeParams.user_id === user_id) $scope.username_is_valid = true;

            });

        };
    });

