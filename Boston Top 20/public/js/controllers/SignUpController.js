angular.module('bostontop20')
    .controller('SignUpController', function($scope, $location, $http, $routeParams) {
        $scope.name = "";
        $scope.email = "";
        $scope.number = "";
        $scope.company = "";
        $scope.mls = "";
        $scope.password = "";

        $scope.submit = function () {
            $scope.message = "";
            $http.post('/signup', {
                name: $scope.name,
                email: $scope.email,
                number: $scope.number,
                company: $scope.company,
                mls: $scope.mls,
                password: $scope.password
            }).then(function (data) {
                if(!data.data.success){
                    $scope.message = data.data.message[0];
                } else {
                    $location.path("/profile");
                }
            });
        }
    })