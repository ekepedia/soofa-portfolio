
function alert_wrong_answer() {
    swal({
        type: "error",
        title: "Incorrect :(",
        showConfirmButton: false,
        timer: 800
    });
}

function alert_cannot_proceed() {
    swal(
        'Nice Try',
        'You need to correctly answer the question before you may proceed!',
        'info'
    );
}

function alert_correct_answer() {
    swal({
        type: "success",
        title: "Correct :)",
        showConfirmButton: false,
        timer: 1000
    });
}

function submit_1($scope, $rootScope, ans, puzzle_id, answers, name) {

    if (!Array.isArray(ans))
        ans = ans ? [ans] : ["ans"];

    if (!Array.isArray(answers))
        answers = answers ? [answers] : [100];

    for (var i = 0; i < ans.length; i++) {
        if ($scope.answer_1 !== ans[i])
            continue;

        alert_correct_answer();
        $scope.can_proceed_1 = true;

        $rootScope.completion_dates[puzzle_id] = $rootScope.completion_dates[puzzle_id] || new Date();

        if (!$rootScope.duration_times[puzzle_id]) {
            $rootScope.duration_times[puzzle_id] = $rootScope.duration_times[puzzle_id] || (new Date().getTime() - $rootScope.last_time)/1000;

            $rootScope.last_time = new Date().getTime();

            $rootScope.answers[puzzle_id] = answers[i];

            $rootScope.names[puzzle_id] = name;

            $rootScope.puzzles[puzzle_id] = {
                duration_time:   $rootScope.duration_times[puzzle_id],
                answer:          answers[i],
                puzzle_name:     name,
                completion_date: $rootScope.completion_dates[puzzle_id],
                response:        $scope.answer_1
            };

            $scope.session.sync_puzzle(puzzle_id);
        }

        return true;
    }

    alert_wrong_answer();

    return false;

}

function submit_2($scope, $rootScope, ans, puzzle_id, answers, name) {
    if (!Array.isArray(ans))
        ans = ans ? [ans] : ["ans"];

    if (!Array.isArray(answers))
        answers = answers ? [answers] : [100];

    for (var i = 0; i < ans.length; i++) {
        if ($scope.answer_2 !== ans[i])
            continue;

        alert_correct_answer();
        $scope.can_proceed_2 = true;

        $rootScope.completion_dates[puzzle_id] = $rootScope.completion_dates[puzzle_id] || new Date();

        if (!$rootScope.duration_times[puzzle_id] ) {
            $rootScope.duration_times[puzzle_id] = $rootScope.duration_times[puzzle_id] || (new Date().getTime() - $rootScope.last_time)/1000;

            $rootScope.last_time = new Date().getTime();

            $rootScope.answers[puzzle_id] = answers[i];

            $rootScope.names[puzzle_id] = name;

            $rootScope.puzzles[puzzle_id] = {
                duration_time:   $rootScope.duration_times[puzzle_id],
                answer:          answers[i],
                puzzle_name:     name,
                completion_date: $rootScope.completion_dates[puzzle_id],
                response:        $scope.answer_2
            };

            $scope.session.sync_puzzle(puzzle_id);
        }

        return true;
    }

    alert_wrong_answer();

    return false;
}

function submit_3($scope, $rootScope, ans, puzzle_id, answers, name) {
    if (!Array.isArray(ans))
        ans = ans ? [ans] : ["ans"];

    if (!Array.isArray(answers))
        answers = answers ? [answers] : [100];

    for (var i = 0; i < ans.length; i++) {
        if ($scope.answer_3 !== ans[i])
            continue;

        alert_correct_answer();
        $scope.can_proceed_3 = true;

        $rootScope.completion_dates[puzzle_id] = $rootScope.completion_dates[puzzle_id] || new Date();

        if (!$rootScope.duration_times[puzzle_id] ) {
            $rootScope.duration_times[puzzle_id] = $rootScope.duration_times[puzzle_id] || (new Date().getTime() - $rootScope.last_time)/1000;

            $rootScope.last_time = new Date().getTime();

            $rootScope.answers[puzzle_id] = answers[i];

            $rootScope.names[puzzle_id] = name;

            $rootScope.puzzles[puzzle_id] = {
                duration_time:   $rootScope.duration_times[puzzle_id],
                answer:          answers[i],
                puzzle_name:     name,
                completion_date: $rootScope.completion_dates[puzzle_id],
                response:        $scope.answer_3
            };

            $scope.session.sync_puzzle(puzzle_id);
        }

        return true;
    }

    alert_wrong_answer();

    return false;
}