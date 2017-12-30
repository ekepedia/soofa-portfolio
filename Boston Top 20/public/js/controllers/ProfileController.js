angular.module('bostontop20')
    .controller('ProfileController', function($scope, $http, $window, $routeParams, $location, $rootScope) {
        $scope.name = "Loading . . .";
        $scope.town = $location.search().town;
        
        $scope.about = $rootScope.user ?
            ($rootScope.user.about ? $rootScope.user.about : "You have not uploaded a description yet. Edit your profile here:") :
            "This person/group has not uploaded a description yet. If this is you, please login here:";

        $scope.img = function () {
            var img = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16][Math.floor(Math.random()*16)];
            return "/img/"+img+".png"
        }

        $scope.blog = $routeParams.blog;

        $scope.agent = $routeParams.agent;

        $scope.testimonials = [{name:"",text:"This agent currently has no testimonials. You may submit one below."}];

        $scope.time = ["past month","past 3 months", "past 6 months", "past year"];
        $scope.dates =["1","3","6","12"];

        $http.get('/api/agent/'+$location.search().town+'/'+$routeParams.agent).then(function (data) {

            $scope.name = data.data.agent.name;

            $scope.url = data.data.agent.url;

            $scope.list = data.data.list;

        });

        $http.get('/api/testimonials/'+$routeParams.agent).then(function (data) {
            if(data.data.testimonials.length > 0)
                $scope.testimonials = data.data.testimonials;
        });

    });