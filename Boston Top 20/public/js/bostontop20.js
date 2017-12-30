angular.module('bostontop20', ['ngRoute','ngAnimate', 'toastr'])

    .config(function($routeProvider, $locationProvider, toastrConfig) {

        var currentUser = function($q, $timeout, $http, $location, $rootScope){
            // Initialize a new promise
            var deferred = $q.defer();
            // Make an AJAX call to check if the user is logged in
            $http.get('/api/me').then(function(data){
                // Authenticated
                if (data.data.user)
                    $rootScope.user = data.data.user;

                deferred.resolve();
            });

            return deferred.promise;
        };

        var loggedIn = function($q, $timeout, $http, $location, $rootScope){

            // Initialize a new promise
            var deferred = $q.defer();
            // Make an AJAX call to check if the user is logged in
            $http.get('/api/me').then(function(data){
                // Authenticated
                if (data.data.user)
                    $rootScope.user = data.data.user;
                else
                    $location.path('/login');

                deferred.resolve();
            });

            return deferred.promise;
        };

        var locations = function ($http, $rootScope, $q) {

            var deferred = $q.defer();

            if (!$rootScope.locations)
            {
                $http.get('/api/locations').then(function(data){

                    $rootScope.locations = data.data;
                    console.log("oops");

                });
            }

            return deferred.resolve()


        }

        var logout = function($q, $timeout, $http, $location, $rootScope){

            // Initialize a new promise
            var deferred = $q.defer();
            // Make an AJAX call to check if the user is logged in
            $http.get('/logout').then(function(data){

                console.log(data);

                $rootScope.user = null;

                $location.path('/login');

                deferred.resolve();
            });

            return deferred.promise;
        };

        $routeProvider

            .when('/', {
                templateUrl : 'pages/index.html',
                controller: 'MainCtrl',
                resolve: { loggedin: currentUser }
            })

            .when('/how-it-works', {
                templateUrl : 'pages/whyus.html',
                resolve: { loggedin: currentUser }
            })

            .when('/faq', {
                templateUrl : 'pages/faq.html',
                resolve: { loggedin: currentUser }
            })

            .when('/find/agents', {
                templateUrl : 'pages/agents.html',
                controller: "AgentController",
                resolve: { loggedin: currentUser}
            })

            .when('/f_agent/:agent', {
                templateUrl : 'pages/agent.html',
                controller: "ProfileController",
                resolve: { loggedin: currentUser }
            })

            .when('/contact', {
                templateUrl : 'pages/contact.html',
                controller: "ContactController",
                resolve: { loggedin: currentUser }
            })

            .when('/advertise', {
                templateUrl : 'pages/advertise.html',
                controller: "AdvertiseController",
                resolve: { loggedin: currentUser }
            })

            .when('/get-a-loan', {
                templateUrl : 'pages/getaloan.html',
                resolve: { loggedin: currentUser }
            })

            .when('/legal-services', {
                templateUrl : 'pages/legal.html',
                resolve: { loggedin: currentUser }
            })
            
            .when('/blog', {
                templateUrl : 'pages/blogarchive.html',
                controller: "BlogIndexController",
                resolve: { loggedin: currentUser }
            })

            .when('/404', {
                templateUrl : 'pages/404.html',
                controller: "MainCtrl",
                resolve: { loggedin: currentUser }
            })

            .when('/left', {
                templateUrl : 'pages/left.html',
                controller: "LeftController",
                resolve: { loggedin: currentUser }
            })
            
            .when('/testimonial/:agent', {
                templateUrl: 'pages/testimonial.html',
                controller: "TestimonialController",
                resolve: { loggedin: currentUser }
            })

            .when('/login', {
                templateUrl: 'pages/login.html',
                resolve: { loggedin: currentUser },
                controller: "LoginController"
            })

            .when('/thank-you', {
                templateUrl: 'pages/thankyou.html',
                controller: "MainCtrl",
                resolve: { loggedin: currentUser }
            })

            .when('/signup', {
                templateUrl : 'pages/signup.html',
                resolve: { loggedin: currentUser },
                controller: "SignUpController"
            })

            .when('/blog/:blog', {
                templateUrl : 'pages/blog.html',
                controller: "BlogController",
                resolve: { loggedin: currentUser }
            })
            
            .when('/lists/:loc/:time', {
                templateUrl : 'pages/list.html',
                controller: "ListController",
                resolve: { loggedin: currentUser }
            })

            .when('/agent-agreement', {
                templateUrl : 'pages/agreement.html',
                resolve: { loggedin: currentUser }
            })

            .when('/onboarding', {
                templateUrl : 'pages/onboarding.html',
                resolve: { loggedin: currentUser }
            })

            .when('/profile', {
                templateUrl: "pages/profile.html",
                controller: "EditController",
                resolve: {loggedin: loggedIn}
            })

            .when('/logout', {
                templateUrl: "pages/login.html",
                resolve: {logout: logout}
            })

            .otherwise('/404') ;
        
        $locationProvider.html5Mode(true);



        angular.extend(toastrConfig, {
            autoDismiss: true,
            maxOpened: 1,
            tapToDismiss: true,
            timeOut: 2400,
            progressBar: true,
            newestOnTop: true,
            positionClass: 'toast-top-right',
            preventDuplicates: false,
            preventOpenDuplicates: false,
            target: 'body'
        });
    })

    .factory('loc', ['$http','$q', '$sce', function($http, $q, $sce) {

        var loc = $q.defer();

        /*$http.get('/api/locations').then(function(data){

            loc.resolve(data.data.sort());

        });*/

        $http.get('/api/locations/html').then(function (data) {

            loc.resolve($sce.trustAsHtml(data.data));

        });

        var dataFactory = {};

        dataFactory.getLocations = function () {
            return loc.promise;
        };

        return dataFactory;

    }])

    .directive('fileInput', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attributes) {
                element.bind('change', function () {
                    $parse(attributes.fileInput)
                        .assign(scope,element[0].files)
                    scope.$apply()
                });
            }
        };
    }])

    .controller('MainCtrl', function($scope, $http, $location) {
        $scope.blogs = [];

        $http.get('/api/blogs').then(function (data) {
            $scope.blogs = data.data.blogs;
        });
    });