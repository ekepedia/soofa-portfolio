angular.module('bostontop20')
    .controller('ContactController', function ($scope, $location, $http, $routeParams) {

        $scope.agent = $routeParams.agent;
        $scope.name = $routeParams.name;

        $scope.submit = function () {

            var req = {
                method: 'POST',
                url: '/email/contact',
                data: {
                    email: $scope.senderemail,
                    name: $scope.sendername,
                    subject: $scope.sendersubject,
                    body: $scope.senderbody
                }
            };

            $http(req).then(function(data){

                if(data.data.success)
                    $location.path("/thank-you");

            });


        }

    })