angular.module('bostontop20')
    .controller('LoginController', function($scope, $location, $http, $routeParams) {
        $scope.email = "";
        $scope.password = "";

        $scope.submit = function () {
            $scope.message = "";
            $http.post('/login', {
                email: $scope.email,
                password: $scope.password
            }).then(function (data) {
                if(!data.data.success){
                    $scope.message = data.data.message[0];
                } else {
                    $location.path("/profile");
                }
            });
        }
    });