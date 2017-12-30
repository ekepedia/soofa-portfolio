angular.module('bostontop20')
    .controller('ListController', function($scope, $location, $http, $routeParams, loc) {

        $scope.submit = function () {
            $scope.message = null;
            $scope.agents2 = [];

            $http.get('/api/list/'+$scope.location+'/'+$scope.months).then(function (data) {

                console.log(data);

                $scope.agents = data.data.list;

                if(!$scope.agents) {
                    $scope.message = "No properties have been sold in "+$scope.location+" in the "+time[dates.indexOf($scope.months)]+".";
                } else if(data.data.list.length < 20 && $scope.months != 12){
                    $http.get('/api/list/'+$scope.location+'/'+dates[dates.indexOf($scope.months)+1]).then(function (data2) {
                        $scope.agents2 = data2.data.list;
                        $scope.message = "Less than 20 agents have sold properties in "+$scope.location+" in the "+time[dates.indexOf($scope.months)]+", so " +
                            "we have also pulled up the top agents from the " + time[dates.indexOf($scope.months)+1] +":";
                    });
                }
            });
        };

        if($routeParams.loc && $routeParams.time){
            $scope.location = $routeParams.loc;
            $scope.months = $routeParams.time;
            $scope.submit();
        }

        $scope.submitnew = function () {

            $location.path( "/lists/"+$scope.locationnew+"/"+$scope.monthsnew);
            
        };

        $scope.agents = [];

        get_pictures($http, $routeParams, $scope);

        loc.getLocations().then(function (loc) {

            $scope.locations_html = loc;

            $("#location").select2();
            $("#months").select2();

            //$scope.location = $routeParams.loc || $scope.locations[0];


        });

        $scope.locationnew = $routeParams.loc;
        $scope.monthsnew = $routeParams.time;

        $scope.adindex = 0;
        $scope.adlimit = 0;

        $scope.time = ["past month","past 3 months", "past 6 months", "past year", "past 5 years"];
        var time = $scope.time;
        var dates =["1","3","6","12","60"];

        $scope.dates = dates;

        $scope.title = function (str)
        {
            return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        }
    });

function get_pictures($http, $routeParams, $scope) {
    $http.get('/api/pictures/' + $routeParams.loc).then(function (data) {

        var pic = data.data.data;

        for(var i = 0 ; i < pic.length ; i++){
            $scope.pic4[(i+1)*4] = pic[i];
        }

        for(var i = 0 ; i < pic.length ; i++){
            $scope.pic3[(i+1)*3] = pic[i];
        }

    });

    $scope.pic4 = function (a) {
        return $scope.pic4[a]
    };

    $scope.pic3 = function (a) {
        return $scope.pic3[a]
    };
}

function load_locations($http, $scope) {

    $http.get('/api/locations/html').then(function (data) {

        $scope.html_locations = data.data;
        console.log("Here");
        console.log($scope.html_locations);

    });

}