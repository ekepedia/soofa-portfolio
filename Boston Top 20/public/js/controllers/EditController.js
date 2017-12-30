angular.module('bostontop20')
    .controller('EditController', function($scope, $location, $http, $routeParams) {

        $scope.save = function () {
            $http.post('/api/me/about', {
                about: $scope.user.about
            }).then(function (data) {
                if(!data.data.success){
                    alert("Saved!");
                } else {
                    alert("Something went wrong, we were unable to save.");
                }
            });
        };

        $scope.uploadFile = function(files) {
            var fd = new FormData();
            //Take the first selected file
            fd.append("image", files[0]);

            $http.post('/me/image', fd, {
                withCredentials: true,
                headers: {'Content-Type': undefined },
                transformRequest: angular.identity
            }).success(function (data) {
                console.log(data);
                $scope.user.url = data.message;
                console.log($scope.user.url);
            }).error(function () {

            });

        };


    })