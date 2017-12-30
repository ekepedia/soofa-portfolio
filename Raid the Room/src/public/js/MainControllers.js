raid_the_room

    .controller('HomeCtrl', function($scope, $http, $location, $rootScope, $window, $timeout, session) {

    $scope.start = function () {
        $rootScope.start_time();
        $location.path('/p/1');
    };

})

    .controller('MainCtrl', function($scope, $interval, $location, $rootScope, $window, $timeout, session) {

        session.sync();

        console.log($rootScope.session);

        $scope.time        = $scope.time || 60*60;
        $rootScope.puzzles = $rootScope.puzzles || {};

        var init = false;
        var stop;

        $rootScope.stop_time = function () {
            if (init) {
                $interval.cancel(stop);
                stop = undefined;
                init = false;
            }
        };

        $rootScope.start_time = function () {
            if (!init) {
                stop = $interval(function () {
                    $scope.time--;

                    $scope.time = $scope.time < 0 ? 0 : $scope.time;

                }, 1000);
                init = true;

                $rootScope.start_complete_time = new Date().getTime();
                $rootScope.last_time           = new Date().getTime();

                session.get_session(function (err, session_data) {

                    console.log(session_data);

                    if (!session_data){
                        session.new_session();
                        return;
                    }

                    session_data = session_data || {};

                    console.log(session_data);

                    $rootScope.start_complete_time = new Date(session_data.start_time).getTime() || new Date().getTime();
                    $rootScope.last_time           = new Date(session_data.last_time).getTime()  || new Date().getTime();

                    var time = (($rootScope.start_complete_time + 60*60*1000) - new Date().getTime())/1000;
                    $scope.time = time < 0 ? 0 : time;
                });


            }
        };

        $scope.minutes = function (seconds, flag) {
            if(!seconds)
                return "00";

            var minutes = Math.floor(seconds/60) + "";

            if ( minutes.length < 2 && !flag)
                minutes = "0" + minutes;

            return minutes;
        };

        $scope.seconds = function (seconds, flag) {
            if(!seconds)
                return "00";

            seconds = Math.round(seconds % 60) + "";

            if ( seconds.length < 2 && !flag)
                seconds = "0" + seconds;

            return seconds;
        };

        $scope.pretty = function (time) {
            if(!time)
                return;

            return moment(time).format('LTS');
        };

        $rootScope.names = $rootScope.names || {
                puzzle_1: "Puzzle 1",
                puzzle_2a: "Puzzle 2a",
                puzzle_2b: "Puzzle 2b",
                puzzle_2c: "Puzzle 2 Final",
                puzzle_3: "Puzzle 3",
                puzzle_4a: "Puzzle 4a",
                puzzle_4b: "Puzzle 4b",
                puzzle_4c: "Puzzle 4c",
                puzzle_5: "Puzzle 5",
                puzzle_6: "Puzzle 6",
                puzzle_7: "Puzzle 7",
                puzzle_8: "Puzzle 8"
            };

        $rootScope.duration_times   = $rootScope.duration_times || {};
        $rootScope.completion_dates = $rootScope.completion_dates || {}
        $rootScope.answers          = $rootScope.answers || {};


        $rootScope.hint_1 = function () {
            $rootScope.hint_1_time = $rootScope.hint_1_time || new Date().getTime();
        };

        $rootScope.hint_2 = function () {
            $rootScope.hint_2_time = $rootScope.hint_2_time || new Date().getTime();
        };

        $rootScope.hint_3 = function () {
            $rootScope.hint_3_time = $rootScope.hint_3_time || new Date().getTime();
        }

    })