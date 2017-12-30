angular.module('bostontop20')
    .controller('BlogIndexController', function($scope, $http, $window, $routeParams, $location, $sce) {
        $scope.blogs = [];

        $http.get('/api/blogs').then(function (data) {
            $scope.blogs = data.data.blogs;
        });


        $scope.currentPage = 0;
        $scope.pageSize = 12;

        $scope.numberOfPages=function(){
            return Math.ceil($scope.blogs.length/$scope.pageSize);
        };

        $scope.toDate = function (date) {
            date = new Date(parseInt(date));
            var monthNames = [
                "January", "February", "March",
                "April", "May", "June", "July",
                "August", "September", "October",
                "November", "December"
            ];

            var day = date.getDate();
            var monthIndex = date.getMonth();
            var year = date.getFullYear();

            return day + ' ' + monthNames[monthIndex] + ' ' + year;
        };

        $scope.toHtml = function (txt) {
            txt =  txt.split('\n').join("</br>");

            return $sce.trustAsHtml((txt? txt : ""));
        };

    });

angular.module('bostontop20').filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});