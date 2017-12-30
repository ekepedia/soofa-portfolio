"use strict";

var raid_the_room = angular.module('raid-the-room', ['ngRoute', 'ngAnimate'])

    .config(function($routeProvider, $locationProvider) {

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

        $routeProvider

            .when('/p/1', {
                templateUrl : 'pages/puzzle1.html',
                controller: 'Puzzle1Ctrl'
            })

            .when('/p/2', {
                templateUrl : 'pages/puzzle2.html',
                controller: 'Puzzle2Ctrl'
            })

            .when('/p/3', {
                templateUrl : 'pages/puzzle3.html',
                controller: 'Puzzle3Ctrl'
            })

            .when('/p/4', {
                templateUrl : 'pages/puzzle4.html',
                controller: 'Puzzle4Ctrl'
            })

            .when('/p/5', {
                templateUrl : 'pages/puzzle5.html',
                controller: 'Puzzle5Ctrl'
            })

            .when('/p/6', {
                templateUrl : 'pages/puzzle6.html',
                controller: 'Puzzle6Ctrl'
            })

            .when('/p/7', {
                templateUrl : 'pages/puzzle7.html',
                controller: 'Puzzle7Ctrl'
            })

            .when('/p/8', {
                templateUrl : 'pages/puzzle8.html',
                controller: 'Puzzle8Ctrl'
            })

            .when('/done', {
                templateUrl : 'pages/done.html',
                controller: 'MainCtrl'
            })


            .when('/', {
                templateUrl : 'pages/home.html',
                controller: 'HomeCtrl'
            });

        $locationProvider.html5Mode(true);
    })

    .service('contacts', function($http) {
        // console.log("Contacts service initiated");

        var contacts = {};
        var data_loaded = false;

        $http.get('/').then(function(data){
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

    .service('session', function($http, $location, $window, $rootScope) {

        sync();

        this.sync = sync;

        function sync () {
            var session_id = $location.search().session_id;

            if (!session_id){
                console.log("ds");
                session_id = new_session_id();
            }

            $http.get('/sessions/' + session_id).then(function(data){

                var session = data.data.session;
                var puzzles = data.data.puzzles;

                $rootScope.session = session;

                _.forEach(puzzles, function (puzzle, puzzle_id) {

                    $rootScope.names[puzzle_id] = puzzle.puzzle_name;
                    $rootScope.duration_times[puzzle_id] = puzzle.duration_time;
                    $rootScope.completion_dates[puzzle_id] = puzzle.completion_date;
                    $rootScope.answers[puzzle_id] = puzzle.answer;

                    $rootScope.puzzles[puzzle_id] = puzzle;

                });

            });
        }

        this.get_session_id = function () {
            var session_id = $location.search().session_id;

            if (!session_id)
                session_id = new_session_id();

            return session_id;
        };

        this.get_session = function (callback) {

            var session_id = this.get_session_id();

            $http.get('/sessions/' + session_id).then(function(data){

                var session = data.data.session;

                callback(null, session);

            });
        };

        this.sync_puzzle = function (puzzle_id) {

            if (!$rootScope.puzzles[puzzle_id])
                return;

            var session_id = this.get_session_id();
            var game_id    = "game_1";

            var puzzle = {
                puzzle_id:       puzzle_id,
                session_id:      session_id,
                completion_date: $rootScope.puzzles[puzzle_id].completion_date,
                duration_time:   $rootScope.puzzles[puzzle_id].duration_time,
                puzzle_name:     $rootScope.puzzles[puzzle_id].puzzle_name,
                answer:          $rootScope.puzzles[puzzle_id].answer,
                response:        $rootScope.puzzles[puzzle_id].response,
                game_id:         "game_1"
            };

            $http.post('/puzzles', puzzle).then(function(data){
                //console.log(data);
            });

            //console.log(puzzle);

        };

        this.new_session = function () {

            var session_id = this.get_session_id();

            var session = {
                session_id: session_id,
                start_time: new Date($rootScope.start_complete_time)
            };

            $http.post('/sessions', session).then(function(data){
                //console.log(data);
            });

            //console.log(puzzle);
        };

        function new_session_id() {
            var session_id = $window.sessionStorage.session_id || Math.floor(Math.random()*90000) + 10000;

            $location.search('session_id', session_id);

            $window.sessionStorage.session_id = session_id;

            return session_id;
        }

    });