angular.module('bostontop20')
    .controller('LeftController', function($scope, $http) {
        $scope.left = 0;
        
        $http.get('/api/left').then(function (data) {
            console.log(data);
            $scope.left = data.data.left;
        });

    });
