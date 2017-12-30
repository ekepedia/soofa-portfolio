"use strict";

toastr.options.timeOut = 2000;

var minimum_dashboard = angular.module('minimum-dashboard', ['ngRoute', 'datatables', 'ngAnimate'])

    .config(function($routeProvider, $locationProvider) {

        var loggedIn = function($q, $timeout, $http, $location, $rootScope){

            // Initialize a new promise
            var deferred = $q.defer();
            // Make an AJAX call to check if the user is logged in
            $http.get('/api/me').then(function(data){
                // Authenticated
                if (data.data.user)
                    $rootScope.user = data.data.user;
                //else
                //   $location.path('/login');

                deferred.resolve();
            });

            return deferred.promise;
        };

        $routeProvider

            .when('/admin/dashboard', {
                templateUrl : 'pages/index.html',
                controller: 'MainCtrl'
            })

            .when('/admin/new', {
                templateUrl : 'pages/new.html',
                controller: 'MainCtrl'
            })

            .when('/admin/login', {
                templateUrl : 'pages/login/index.html',
                controller: 'LoginController'
            });

        $locationProvider.html5Mode(true);
    })

    .directive("fileread", [function () {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        scope.$apply(function () {
                            scope.fileread = loadEvent.target.result;
                        });
                    };
                    reader.readAsDataURL(changeEvent.target.files[0]);
                });
            }
        }
    }])

    .factory('authInterceptor', function ($rootScope, $q, $window, $location) {
        return {
            request: function (config) {
                $rootScope.logout = function () {
                    $window.sessionStorage.token = null;
                    $location.path("/admin/login");
                };

                config.headers = config.headers || {};

                if ($window.sessionStorage.token && $window.sessionStorage.token !== null && $window.sessionStorage.token !== "null") {

                    config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
                } else {
                    //$location.path('/admin/login');
                }
                return config;
            },
            response: function (response) {

                if (response.status === 401) {

                }
                return response || $q.when(response);
            },
            'responseError': function(errorResponse) {
                if(errorResponse.status === 401){
                    $window.sessionStorage.token = null;
                    $location.path("/admin/login");
                }
            }
        };
    })

    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('authInterceptor');
    })

    .service('companies', function($http) {
        console.log("Company service initiated");

        var companies = {};
        var data_loaded = false;

        toastr.info('Loading Companies');


        $http.get('admin/api/companies').then(function(data){
            toastr.success('Companies Loaded');

            console.log("Companies loaded");
            data_loaded = true;
            companies = data.data;
        });

        this.get_companies = function (callback) {
            return return_companies(callback);
        };

        function return_companies(callback) {
            if (data_loaded)
                return callback(companies);

            setTimeout(function () {
                return_companies(callback);
            }, 100);
        }
    })

    .service('stats', function($http) {
        console.log("Stats service initiated");

        var companies = {};
        var users = {};
        var groups = {};
        var messages = {};

        var c_data_loaded = false;
        var u_data_loaded = false;
        var g_data_loaded = false;
        var m_data_loaded = false;


        toastr.info('Loading Stats');

        $http.get('/admin/api/companies').then(function(data){
            toastr.success('Company Stats Loaded');
            if(data.data) companies = _.keys(data.data || {}).length;
            c_data_loaded = true;
        });

        $http.get('/admin/api/users').then(function(data){
            toastr.success('User Stats Loaded');
            if(data.data) users = _.keys(data.data || {}).length;
            u_data_loaded = true;
        });

        $http.get('/admin/api/groups').then(function(data){
            toastr.success('Group Stats Loaded');
            if(data.data) groups = _.keys(data.data || {}).length;
            g_data_loaded = true;
        });

        $http.get('/admin/api/messages').then(function(data){
            toastr.success('Messages Stats Loaded');
            if(data.data) messages = data.data;
            m_data_loaded = true;
        });

        this.get_companies = function (callback) {
            return return_companies(callback);
        };

        function return_companies(callback) {
            if (c_data_loaded)
                return callback(companies);

            setTimeout(function () {
                return_companies(callback);
            }, 100);
        }

        this.get_users = function (callback) {
            return return_users(callback);
        };

        function return_users(callback) {
            if (u_data_loaded)
                return callback(users);

            setTimeout(function () {
                return_users(callback);
            }, 100);
        }

        this.get_groups = function (callback) {
            return return_groups(callback);
        };

        function return_groups(callback) {
            if (g_data_loaded)
                return callback(groups);

            setTimeout(function () {
                return_groups(callback);
            }, 100);
        }

        this.get_messages = function (callback) {
            return return_messages(callback);
        };

        function return_messages(callback) {
            if (m_data_loaded)
                return callback(messages);

            setTimeout(function () {
                return_messages(callback);
            }, 100);
        }
    })

    .service('users', function($http) {
        console.log("User service initiated");

        var users = {};
        var data_loaded = false;

        toastr.info('Loading Users');

        $http.get('admin/api/users').then(function(data){
            toastr.success('Users Loaded');

            console.log("Users loaded");
            data_loaded = true;
            users = data.data;
        });

        this.reload_users = function () {
            data_loaded = false;

            toastr.info('Loading Users');

            $http.get('admin/api/users').then(function(data){
                toastr.success('Users Loaded');

                console.log("Users loaded");
                data_loaded = true;
                users = data.data;
            });
        };

        this.get_users = function (callback) {
            return return_users(callback);
        };

        function return_users(callback) {
            if (data_loaded)
                return callback(users);

            setTimeout(function () {
                return_users(callback);
            }, 100);
        }
    })

    .service('messages', function($http) {
        console.log("Message service initiated");

        var stat_data = {};
        var data_loaded = false;

        toastr.info('Loading Messages');

        $http.get('/admin/api/messages/all').then(function(data){
            toastr.success('Messages Loaded');

            console.log("Messages loaded");
            data_loaded = true;
            stat_data = data.data;
        });

        this.get_stats = function (callback) {
            return return_stats(callback);
        };

        function return_stats(callback) {
            if (data_loaded)
                return callback(stat_data);

            setTimeout(function () {
                return_stats(callback);
            }, 100);
        }
    })

    .service('contacts', function($http) {
        console.log("Contacts service initiated");

        var contacts = {};
        var data_loaded = false;

        toastr.info('Loading Contacts');

        $http.get('/admin/api/contacts/all').then(function(data){
            toastr.success('Contacts Loaded');

            console.log("Contacts loaded");
            data_loaded = true;
            contacts = data.data;
        });

        this.get_contacts = function (callback) {
            return return_contacts(callback);
        };

        function return_contacts(callback) {
            if (data_loaded)
                return callback(contacts);

            setTimeout(function () {
                return_contacts(callback);
            }, 100);
        }
    })

    .controller('LoginController', function($scope, $http, $location, $window) {
        $scope.login = function () {

            $http.post('/auth/login?admin=true', {
                email: $scope.email,
                password: $scope.password
            }).then(function (data) {
                $window.sessionStorage.token = data.data.data.token;
                $location.path("/admin/dashboard");
            }).catch(function (err) {
                $location.path("/admin/login");
            });
        }
    })


    .controller('MainCtrl', function($scope, $http, $location, $rootScope, $window, messages, $timeout, users, companies, contacts, stats) {

        $rootScope.logout = function () {
            $window.sessionStorage.token = null;
            $location.path("/admin/login");
        };

        $scope.heights = {
            1: 20,
            2: 3,
            3: 4,
            4: 20,
            5: 80
        };

        $scope.reset = function () {
            for (var i = 1 ; i <= 5 ; i++) {
                $scope.heights[i] = Math.round(Math.random()*100);
            }
            console.log($scope.heights);
        };

        stats.get_companies(function (companies) {
            $timeout(function(){
                $scope.companies = companies;
                $('.company-loading').fadeOut("fast");
                setTimeout(function (args) {$( "#company" ).fadeIn( "fast");}, 500);
            });
        });

        stats.get_users(function (users) {
            $timeout(function(){
                $scope.users = users;
                $('.user-loading').fadeOut("fast");
                $( "#user" ).fadeIn( "fast");
            });
        });

        stats.get_groups(function (groups) {
            $timeout(function(){
                $scope.groups = groups;
                $('.group-loading').fadeOut("fast");
                $( "#group" ).fadeIn( "fast");
            });
        });

        stats.get_messages(function (messages) {
            $timeout(function(){
                $scope.messages = messages;
                $('.message-loading').fadeOut("fast");
                $( "#message" ).fadeIn( "fast");
            });
        });

    });