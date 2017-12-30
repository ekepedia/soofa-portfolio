"use strict";

raid_the_room

    .controller('Puzzle1Ctrl', function($scope, $http, $location, $rootScope, $window, $timeout, session) {

        $rootScope.start_time();

        $scope.session = session;
        $scope.session.sync();

        var can_proceed_1 = false;

        if ($rootScope.puzzles["puzzle_1"]) {
            can_proceed_1        = $rootScope.puzzles["puzzle_1"].duration_time;
            $scope.can_proceed_1 = $rootScope.puzzles["puzzle_1"].duration_time;
            $scope.answer_1      = $rootScope.puzzles["puzzle_1"].response;
        }

        $scope.next = function () {
            if (!can_proceed_1) {
                return alert_cannot_proceed();
            }
            $location.path('/p/2');
        };

        $scope.back = function () {
            $location.path('/');
        };

        $scope.submit_1 = function () {
            can_proceed_1 = submit_1($scope, $rootScope, ["rotors", "dials"], "puzzle_1", ["124","543"], "Dial Box");
        };

    })

    .controller('Puzzle2Ctrl', function($scope, $http, $location, $rootScope, $window, $timeout, session) {

        $rootScope.start_time();

        $scope.session = session;
        $scope.session.sync();

        var can_proceed_1 = false;
        var can_proceed_2 = false;

        if ($rootScope.puzzles["puzzle_2a"]) {
            can_proceed_1        = $rootScope.puzzles["puzzle_2a"].duration_time;
            $scope.can_proceed_1 = $rootScope.puzzles["puzzle_2a"].duration_time;
            $scope.answer_1      = $rootScope.puzzles["puzzle_2a"].response;
        }

        if ($rootScope.puzzles["puzzle_2b"]) {
            can_proceed_2        = $rootScope.puzzles["puzzle_2b"].duration_time;
            $scope.can_proceed_2 = $rootScope.puzzles["puzzle_2b"].duration_time;
            $scope.answer_2      = $rootScope.puzzles["puzzle_2b"].response;
        }

        $scope.is_ready = false;

        $scope.next = function () {
            if (!can_proceed_1 || !can_proceed_2) {
                return alert_cannot_proceed();
            }

            var puzzle_id = "puzzle_2c";

            $rootScope.completion_dates[puzzle_id] = $rootScope.completion_dates[puzzle_id] || new Date();

            if (!$rootScope.duration_times[puzzle_id]) {
                $rootScope.duration_times[puzzle_id] = $rootScope.duration_times[puzzle_id] || (new Date().getTime() - $rootScope.last_time)/1000;

                $rootScope.last_time = new Date().getTime();

                $rootScope.answers[puzzle_id] = "831";

                var name = "Tetris+Qrts";

                $rootScope.names[puzzle_id] = name;

                $rootScope.puzzles[puzzle_id] = {
                    duration_time:   $rootScope.duration_times[puzzle_id],
                    answer:          "831",
                    puzzle_name:     name,
                    completion_date: $rootScope.completion_dates[puzzle_id],
                    response:        "na"
                };

                $scope.session.sync_puzzle(puzzle_id);}

            $location.path('/p/3');
        };

        $scope.back = function () {
            $location.path('/p/1');
        };

        $scope.ready = function () {
            $scope.is_ready = true;
        };

        $scope.submit_1 = function () {
            can_proceed_1 = submit_1($scope, $rootScope, "167", "puzzle_2a", "167", "Tetris Blocks");
        };

        $scope.submit_2 = function () {
            can_proceed_2 = submit_2($scope, $rootScope, "912", "puzzle_2b", "912", "Quarters");
        };

    })

    .controller('Puzzle3Ctrl', function($scope, $http, $location, $rootScope, $window, $timeout, session) {

        $rootScope.start_time();

        $scope.session = session;
        $scope.session.sync();

        var can_proceed_1 = false;

        if ($rootScope.puzzles["puzzle_3"]) {
            can_proceed_1        = $rootScope.puzzles["puzzle_3"].duration_time;
            $scope.can_proceed_1 = $rootScope.puzzles["puzzle_3"].duration_time;
            $scope.answer_1      = $rootScope.puzzles["puzzle_3"].response;
        }

        $scope.is_ready = false;

        $scope.next = function () {
            if (!can_proceed_1) {
                return alert_cannot_proceed();
            }
            $location.path('/p/4');
        };

        $scope.back = function () {
            $location.path('/p/2');
        };

        $scope.ready = function () {
            $scope.is_ready = true;
        };

        $scope.submit_1 = function () {
            can_proceed_1 = submit_1($scope, $rootScope, "ace", "puzzle_3", "706", "Activity");
        };


    })

    .controller('Puzzle4Ctrl', function($scope, $http, $location, $rootScope, $window, $timeout, session) {

        $rootScope.start_time();

        $scope.session = session;
        $scope.session.sync();

        var can_proceed_1 = false;
        var can_proceed_2 = false;
        var can_proceed_3 = false;

        if ($rootScope.puzzles["puzzle_4a"]) {
            can_proceed_1        = $rootScope.puzzles["puzzle_4a"].duration_time;
            $scope.can_proceed_1 = $rootScope.puzzles["puzzle_4a"].duration_time;
            $scope.answer_1      = $rootScope.puzzles["puzzle_4a"].response;
        }

        if ($rootScope.puzzles["puzzle_4b"]) {
            can_proceed_2        = $rootScope.puzzles["puzzle_4b"].duration_time;
            $scope.can_proceed_2 = $rootScope.puzzles["puzzle_4b"].duration_time;
            $scope.answer_2g     = "15";
            $scope.answer_2b     = "8";
            $scope.answer_2o     = "16";
        }

        if ($rootScope.puzzles["puzzle_4c"]) {
            can_proceed_3        = $rootScope.puzzles["puzzle_4c"].duration_time;
            $scope.can_proceed_3 = $rootScope.puzzles["puzzle_4c"].duration_time;
            $scope.answer_3      = $rootScope.puzzles["puzzle_4c"].response;
        }

        $scope.is_ready = false;

        $scope.next = function () {

            can_proceed_3 = submit_3($scope, $rootScope, "plane", "puzzle_4c", "plane", "Cryptex");

            if (!can_proceed_1 || !can_proceed_2 || !can_proceed_3) {
                return alert_cannot_proceed();
            }
            $location.path('/p/5');
        };

        $scope.back = function () {
            $location.path('/p/3');
        };

        $scope.ready = function () {
            $scope.is_ready = true;
        };

        $scope.submit_1 = function () {
            can_proceed_1 = submit_1($scope, $rootScope, "paper", "puzzle_4a", "WRHSJ", "Riddle");
        };

        $scope.submit_2 = function () {
            $scope.answer_2 =  ($scope.answer_2g || "").trim() + ($scope.answer_2b || "").trim() + ($scope.answer_2o || "").trim();
            can_proceed_2 = submit_2($scope, $rootScope, "15816", "puzzle_4b","P T K", "Magic Square");
        };

    })

    .controller('Puzzle5Ctrl', function($scope, $http, $location, $rootScope, $window, $timeout, session) {

        $rootScope.start_time();

        $scope.session = session;
        $scope.session.sync();

        var can_proceed_1 = false;

        if ($rootScope.puzzles["puzzle_5"]) {
            can_proceed_1        = $rootScope.puzzles["puzzle_5"].duration_time;
            $scope.can_proceed_1 = $rootScope.puzzles["puzzle_5"].duration_time;
            $scope.answer_1a     = "helena";
            $scope.answer_2      = "topeka";
            $scope.answer_3      = "frankfort";
            $scope.answer_4      = "columbus";
            $scope.answer_5      = "nashville";
            $scope.answer_6      = "trenton";
            $scope.answer_7      = "albany";
        }

        $scope.is_ready = false;

        $scope.next = function () {
            if (!can_proceed_1) {
                return alert_cannot_proceed();
            }
            $location.path('/p/6');
        };

        $scope.back = function () {
            $location.path('/p/4');
        };

        $scope.ready = function () {
            $scope.is_ready = true;
        };

        var combined_unscramble = "helenatopekafrankfortcolumbusnashvilletrentonalbany";

        $scope.submit_1 = function () {

            $scope.answer_1 =  $scope.answer_1a + $scope.answer_2 + $scope.answer_3 +  $scope.answer_4 +
                $scope.answer_5 +  $scope.answer_6 + $scope.answer_7;

            $scope.answer_1 = $scope.answer_1.toLowerCase();

            can_proceed_1 = submit_1($scope, $rootScope, combined_unscramble, "puzzle_5", "723", "Unscramble");
        };

    })

    .controller('Puzzle6Ctrl', function($scope, $http, $location, $rootScope, $window, $timeout, session) {

        $rootScope.start_time();

        $scope.session = session;
        $scope.session.sync();

        var can_proceed_1 = false;

        if ($rootScope.puzzles["puzzle_6"]) {
            can_proceed_1        = $rootScope.puzzles["puzzle_6"].duration_time;
            $scope.can_proceed_1 = $rootScope.puzzles["puzzle_6"].duration_time;
            $scope.answer_1a     = "up";
            $scope.answer_2      = "left";
            $scope.answer_3      = "up";
            $scope.answer_4      = "right";
            $scope.answer_5      = "down";
            $scope.answer_6      = "right";
            $scope.answer_7      = "up";
        }

        $scope.is_ready = false;

        $scope.next = function () {
            if (!can_proceed_1) {
                return alert_cannot_proceed();
            }
            $location.path('/p/7');
        };

        $scope.back = function () {
            $location.path('/p/5');
        };

        $scope.ready = function () {
            $scope.is_ready = true;
        };

        var combined_answer = "upleftuprightdownrightup";

        $scope.submit_1 = function () {

            $scope.answer_1 =  $scope.answer_1a + $scope.answer_2 + $scope.answer_3 +  $scope.answer_4 +
                $scope.answer_5 +  $scope.answer_6 + $scope.answer_7;

            $scope.answer_1 = $scope.answer_1.toLowerCase();

            can_proceed_1 = submit_1($scope, $rootScope, combined_answer, "puzzle_6",
                "First up and following directions rotated clockewise once", "Directions");
        };

    })

    .controller('Puzzle7Ctrl', function($scope, $http, $location, $rootScope, $window, $timeout, session) {

        $rootScope.start_time();

        $scope.session = session;
        $scope.session.sync();

        var can_proceed_1 = false;

        if ($rootScope.puzzles["puzzle_7"]) {
            can_proceed_1        = $rootScope.puzzles["puzzle_7"].duration_time;
            $scope.can_proceed_1 = $rootScope.puzzles["puzzle_7"].duration_time;
            $scope.answer_1      = $rootScope.puzzles["puzzle_7"].response;
        }

        $scope.is_ready = false;

        $scope.next = function () {
            if (!can_proceed_1) {
                return alert_cannot_proceed();
            }
            $location.path('/p/8');
        };

        $scope.back = function () {
            $location.path('/p/6');
        };

        $scope.ready = function () {
            $scope.is_ready = true;
        };

        $scope.submit_1 = function () {
            can_proceed_1 = submit_1($scope, $rootScope, "156", "puzzle_7", "249", "Logic Puzzle");
        };

    })

    .controller('Puzzle8Ctrl', function($scope, $http, $location, $rootScope, $window, $timeout, session) {

        $rootScope.start_time();

        $scope.session = session;
        $scope.session.sync();

        var can_proceed_1 = false;

        if ($rootScope.puzzles["puzzle_8"]) {
            can_proceed_1        = $rootScope.puzzles["puzzle_8"].duration_time;
            $scope.can_proceed_1 = $rootScope.puzzles["puzzle_8"].duration_time;
            $scope.answer_1      = $rootScope.puzzles["puzzle_8"].response;
        }

        $scope.next = function () {

            can_proceed_1 = submit_1($scope, $rootScope, "raiderswin", "puzzle_8", "Congratulations! You Win!", "End the Clock");

            if (can_proceed_1) {
                $rootScope.end_complete_time = new Date().getTime();
                $rootScope.stop_time();
            }

            if (!can_proceed_1) {
                return alert_cannot_proceed();
            }

            $location.path('/done');
        };

        $scope.back = function () {
            $location.path('/p/7');
        };


    });