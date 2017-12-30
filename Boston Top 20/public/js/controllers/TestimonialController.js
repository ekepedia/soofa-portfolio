angular.module('bostontop20')
    .controller('TestimonialController', function($scope, $location, $http, $routeParams) {
    $scope.name = "";
    $scope.email = "";
    $scope.text = "";

    $http.get('/api/agent/'+$location.search().town+'/'+$routeParams.agent).then(function (data) {

        $scope.agent = data.data.agent.name;

        $scope.list = data.data.list;

    });

    $scope.submit = function () {
        $http.post('/api/testimonial/new', {
            agentId: $routeParams.agent,
            name: $scope.name,
            email: $scope.email,
            date: new Date().getTime(),
            text: $scope.text
        }).then(function (data) {
            console.log($location.search().town);
            console.log($routeParams.agent);
            console.log("/f_agent/"+$routeParams.agent+"?town="+$location.search().town);
            $location.path("/f_agent/"+$routeParams.agent+"?town="+$location.search().town);
        });
    }
})