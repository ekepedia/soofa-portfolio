angular.module('bostontop20-admin', ['ngRoute','ngAnimate', 'toastr'])

    .config(function($routeProvider, $locationProvider, toastrConfig) {
        $routeProvider

            .when('/admin/index', {
                templateUrl : 'pages/admin/index.html',
                controller: 'MainCtrl'
            })

            .when('/admin/blog/new', {
                templateUrl : 'pages/admin/new-blog.html',
                controller: 'BlogCtrl'
            })

            .when('/admin/blog/edit/:id', {
                templateUrl : 'pages/admin/edit-blog.html',
                controller: 'BlogEditCtrl'
            })

            .when('/admin/blogs', {
                templateUrl : 'pages/admin/blogs.html',
                controller: 'BlogIndexCtrl'
            })

            .when('/admin/testimonials', {
                templateUrl : 'pages/admin/testimonials.html',
                controller: 'TestCtrl'
            });

        $locationProvider.html5Mode(true);

        angular.extend(toastrConfig, {
            autoDismiss: true,
            maxOpened: 1,
            tapToDismiss: true,
            timeOut: 2400,
            progressBar: true,
            newestOnTop: true,
            positionClass: 'toast-top-right',
            preventDuplicates: false,
            preventOpenDuplicates: false,
            target: 'body'
        });
    })

    .controller('MainCtrl', function($scope, $location) {

    })

    .controller('BlogCtrl', function($scope, $location, $sce, $http) {

        $scope.toHtml = function (txt, title, date) {
            txt =  txt.split('\n').join("</br>");
            return $sce.trustAsHtml("<h1>"+(title? title : "")+"</h1>"+(date? date : "")+"</br></br>"+(txt? txt : ""));
        };

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

        $scope.title = "A Sample title";
        $scope.date = $scope.toDate(new Date());
        $scope.time = new Date().getTime();
        $scope.text = "This is your <b>Blog post</b>.There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.\n\nType <i>Whatever you want</i>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
        $scope.exp = new RegExp('\n', 'g');

        $("#date").datepicker({
            dateFormat: 'dd/mm/yy'}).on("changeDate", function (e) {
            console.log(e);
            $scope.date = $scope.toDate(e.date);
            $scope.time = new Date(e.date).getTime();
            $scope.$apply();
        });

        $scope.submit = function (title, time, text) {
            $http.post('/api/blog/new',{title: title, time: time, text:text}).then(function (data) {
                $location.path("/admin/blogs");
            });
        }

    })

    .controller('BlogEditCtrl', function($scope, $location, $sce, $http, $routeParams) {

        $scope.toHtml = function (txt, title, date) {
            txt =  txt.split('\n').join("</br>");
            return $sce.trustAsHtml("<h1>"+(title? title : "")+"</h1>"+(date? date : "")+"</br></br>"+(txt? txt : ""));
        };

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

        $scope.title = "";
        $scope.date = $scope.toDate(new Date());
        $scope.time = new Date().getTime();
        $scope.text = "";

        $("#date").datepicker({
            dateFormat: 'dd/mm/yy'}).on("changeDate", function (e) {
            console.log(e);
            $scope.date = $scope.toDate(e.date);
            $scope.time = new Date(e.date).getTime();
            $scope.$apply();
        });

        $scope.submit = function (title, time, text) {
            $http.post('/api/blog/edit',{url:$routeParams.id, title: title, time: time, text:text}).then(function (data) {
                $location.path("/admin/blogs");
            });
        };

        $http.get('/api/blog/'+$routeParams.id).then(function (data) {
            if(!data.data.success){
                $location.path( "/404" );
            }
            
            var blog = data.data.blog;

            $scope.title = blog.title;
            $scope.date = $scope.toDate(new Date(parseInt(blog.date)));
            $scope.time = new Date(parseInt(blog.date)).getTime();
            $scope.text = blog.text;
        });

    })

    .controller('BlogIndexCtrl', function($scope, $location, $sce, $http,$window) {

        $scope.blogs = [];

        $(document).ready(function() {
            $http.get('/api/admin/blogs').then(function (data) {
                $scope.blogs = data.data.blogs;

                //$('#blogs').DataTable();
            });
        });

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

        $scope.delete = function (url) {
            if(confirm("Are you sure?")) {
                $http.get('/api/blog/delete/' + url).then(function (data) {
                    console.log(data);
                    if (data.data.success)
                        $window.location.href = '/admin/blogs';
                });
            }
        }
    })

    .controller('TestCtrl', function($scope, $location, $sce, $http,$window) {

        $scope.testimonials = [];


        $(document).ready(function() {
            $http.get('/api/testimonials').then(function (data) {

                $scope.testimonials = data.data.testimonials;

                //$('#blogs').DataTable();
            });
        });

        $scope.delete = function (id) {
            if(confirm("Are you sure?")) {
                $http.get('/api/testimonial/delete/' + id).then(function (data) {
                    console.log(data);
                    if (data.data.success)
                        $window.location.href = '/admin/testimonials';
                });
            }
        };

        $scope.approve = function (id) {
            if(confirm("Are you sure?")) {
                $http.get('/api/testimonial/approve/' + id).then(function (data) {
                    console.log(data);
                    if (data.data.success)
                        $window.location.href = '/admin/testimonials';
                });
            }
        }
    });