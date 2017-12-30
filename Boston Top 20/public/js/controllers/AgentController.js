angular.module('bostontop20')
    .controller('AgentController', function($scope, $http, $routeParams, $location, $rootScope, loc) {

        $scope.blogs = [];

        $http.get('/api/blogs').then(function (data) {
            $scope.blogs = data.data.blogs;
        });
        
        var dates =["1","3","6","12"];
        var time = ["past month","past 3 months", "past 6 months", "past year"];

        loc.getLocations().then(function (loc) {
            $scope.locations_html = loc;
            $scope.location = "Abington";
        });

        $scope.months   = "1";
        $scope.location = "Abington";

        $scope.agents = [];
        $scope.agents2 = [];

        $scope.message = null;

        $scope.submit = function () {
            $location.path( "/lists/"+$scope.location+"/"+$scope.months);
        };

    });