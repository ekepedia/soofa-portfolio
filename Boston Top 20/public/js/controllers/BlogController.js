angular.module('bostontop20')
    .controller('BlogController', function($scope, $http, $window, $routeParams, $location, $sce) {

        $scope.blogs = [];

        $http.get('/api/blogs').then(function (data) {
            $scope.blogs = data.data.blogs;
        });
        
        $scope.blog = {text: '',title:'',date:new Date().getTime()};

        $scope.toDate = function (date) {
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

        $scope.toHtml = function (blog) {
            blog.text =  blog.text.split('\n').join("</br>");

            var date = new Date(parseInt(blog.date));

            return $sce.trustAsHtml("<h1>"+(blog.title? blog.title : "")+"</h1>"+(date? $scope.toDate(date) : "")+"</br></br>"+(blog.text? blog.text : ""));
        };

        $http.get('/api/blog/'+$routeParams.blog).then(function (data) {
            if(!data.data.success){
                $location.path( "/404" );
            }
            $scope.blog = data.data.blog;
        });
        
    });
