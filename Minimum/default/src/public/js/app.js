"use strict";
var timezone = new Date().getTimezoneOffset()*60*1000;

var minimum_app = angular.module('minimum-app', ['ngRoute', 'ngAnimate'])

    .config(function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
    })

    .factory('authInterceptor', function ($rootScope, $q, $window, $location) {
        return {
            request: function (config) {
                $rootScope.logout = function () {
                    $window.sessionStorage.token = null;
                    // TODO
                };

                config.headers = config.headers || {};

                if ($window.sessionStorage.token && $window.sessionStorage.token !== null && $window.sessionStorage.token !== "null") {

                    config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
                } else {
                    // TODO
                }
                return config;
            },
            response: function (response) {

                if (response.status === 401) {

                }
                return response || $q.when(response);
            },
            'responseError': function(errorResponse) {
                if(errorResponse.status === 401){
                    $window.sessionStorage.token = null;
                    // TODO
                }
            }
        };
    })

    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('authInterceptor');
    })

    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.defaults.headers.patch = {
            'Content-Type': 'application/json;charset=utf-8'
        }
    }])

    .controller('AppController', function($scope, $http, $location, $rootScope, $window, $sce) {

        $('.login-pane').fadeIn(1000);

        $rootScope.logout = function () {
            $window.sessionStorage.token = null;
            $location.path("/admin/login");
        };

        $scope.prev = function () {
            $scope.current_index = $scope.prev_index;
            play();
        };

        $scope.next = function () {
            $scope.current_index = $scope.next_index;
            play();
        };

        $scope.count_unread = function (m) {
            var unread = _.filter(m, function (message) {
                if(message.sender_id === $window.sessionStorage.user_id)
                    return false;

                if(!message.watched)
                    return true;

                return _.keys(message.watched).indexOf($window.sessionStorage.user_id) === -1
            });

            return unread.length;
        };

        $scope.count_received = function (m) {
            var received = _.filter(m, function (message) {
                if(message.sender_id === $window.sessionStorage.user_id)
                    return false;

                return true;
            });

            return received.length;
        };

        $scope.login = function () {

            $http.post('/auth/login', {
                email:    $scope.email,
                password: $scope.password
            }).then(function (data) {
                if(data && data.data){

                    var user_id = "7"; //data.data.data.user.user_id;

                    $window.sessionStorage.token   = data.data.data.token;
                    $window.sessionStorage.user_id = user_id;

                    load_messages($window.sessionStorage.user_id, $scope, $http);

                    $(".login-pane").fadeOut(500, function () {
                        //$(".left-column").css("background-color","#222222");
                        $(".left-column").animate({ 'background-color': "#1b1b1b"},500);
                        $(".messages-pane").fadeIn(500);
                        $(".select-message").fadeIn(500);
                        $(".inbox").fadeIn(500);
                    });

                } else {
                    alert("nah");
                }
                // TODO
            }).catch(function (err) {
                // TODO
                alert("nah");

            });
        };

        define_contact_methods($scope);

        $scope.set_messages = function (m) {
            $scope.current_messages = m;
            $("image").attr('xlink:href', $scope.get_photo($scope.get_inbox_contact($scope.current_messages)));

            calculate_swimlanes();
            $scope.current_index = get_start($scope);
            play();
        };

        $scope.is_selected = function (m) {
            return $scope.current_messages === m;
        };

        $scope.safe_url = function (url) {
            return $sce.trustAsResourceUrl(url);
        };

        function play(starting_index) {
            starting_index = starting_index || $scope.current_index;
            $scope.current_index = starting_index;

            var m = $scope.current_messages[starting_index];

            $scope.video_url = m.mov_url;

            $(".select-message").fadeOut("fast", function () {
            });

            $scope.selected = m.message_id;

            next_index($scope);
            prev_index($scope);

            var created_at = new Date().getTime();

            var obj = {};

            obj[$window.sessionStorage.user_id] = {
                origin: "minimum-web",
                time:   created_at
            };

            var watched = $scope.current_messages[starting_index].watched || {};

            watched[$window.sessionStorage.user_id] = {
                origin: "minimum-web",
                time:   created_at
            };

            $scope.current_messages[starting_index].watched = watched;

            $http.patch('/v0.0/messages/'+m.message_id+'/watched', obj);
        }

        function calculate_swimlanes() {
            var messages        = $scope.current_messages;
            var current_user_id = $window.sessionStorage.user_id;

            var swimlanes = [];

            for ( var i = 0; i < messages.length ; i++ ) {
                var sender = messages[i].sender_id;

                var current_message = messages[i];
                var next_message    = messages[i + 1] || null;
                var prev_message    = messages[i - 1] || null;

                if (sender === current_user_id ) { // S

                    if ( next_message && next_message.sender_id === current_user_id && next_message.created_at + 6*1000*60 > current_message.created_at) { // SS

                        if ( prev_message && prev_message.sender_id === current_user_id && prev_message.created_at - 6*1000*60 < current_message.created_at) { // SSS
                            swimlanes.push(swimlane_middle(i, true));
                        } else { // SSR
                            swimlanes.push(swimlane_right(i, true));
                            swimlanes.push(swimlane_middle(i, true));
                        }

                    } else { // SR

                        if ( prev_message && prev_message.sender_id === current_user_id && prev_message.created_at - 6*1000*60 < current_message.created_at) { // SRS
                            swimlanes.push(swimlane_middle(i, true));
                            swimlanes.push(swimlane_left(i, true));
                        } else { // SRR
                            swimlanes.push(swimlane_full(i, true));
                        }
                    }
                } else { // R
                    if ( next_message && next_message.sender_id !== current_user_id && next_message.created_at + 6*1000*60 > current_message.created_at) { // RR

                        if ( prev_message && prev_message.sender_id !== current_user_id && prev_message.created_at - 6*1000*60 < current_message.created_at) { // RRR

                            swimlanes.push(swimlane_middle(i, false));
                        } else { // RRS
                            swimlanes.push(swimlane_right(i, false));
                            swimlanes.push(swimlane_middle(i, false));
                        }

                    } else { // RS

                        if ( prev_message && prev_message.sender_id !== current_user_id && prev_message.created_at - 6*1000*60 < current_message.created_at) { // RSR

                            swimlanes.push(swimlane_middle(i, false));
                            swimlanes.push(swimlane_left(i, false));
                        } else { // RSS
                            if ( prev_message && prev_message.sender_id !== current_user_id && prev_message.created_at - 60*1000*60 > current_message.created_at)
                                swimlanes.push(swimlane_gap(i, false));

                            swimlanes.push(swimlane_full(i, false));
                        }
                    }
                }
            }

            var swimlane_index = 0;
            for ( i = 0; i < swimlanes.length ; i++ ) {
                if(swimlanes[i].type === "swimlane-left-pill" || swimlanes[i].type === "swimlane-full-pill")
                    swimlanes[i].swimlane_index = swimlane_index++;
                else
                    swimlanes[i].swimlane_index = swimlane_index;
            }

            $scope.swimlanes = swimlanes;
        }

        $scope.play_swimlane = function (message_index) {
            $scope.current_index = message_index;
            play();
        };

        $scope.unwatched_swimlane = function (message_index) {
            return message_index < $scope.current_index;
        };

        $scope.current_swimlane = function (message_index) {
            return message_index === $scope.current_index ? "swimlane-current" : "";
        };

        var video_ended = false;

        $('.minimum-video').on('ended', function () {
            video_ended = true;
            $scope.next();
        });

        $('.minimum-video').on('loadstart', function (event) {
            video_ended = false;
            $(".video-loading").fadeIn(500);
        });

        $('.minimum-video').on('canplay', function (event) {
            $(".video-loading").stop();
            $(".video-loading").fadeOut(500);
            $(".minimum-video").fadeIn(500);
        });

        var timeoutId;

        $( "image" )
            .mouseup(function() {
                clearTimeout(timeoutId);
                stop_recording();
            })
            .mousedown(function() {
                timeoutId = setTimeout(record, 100);
            });

        $scope.get_inbox_contact = function (m) {
            if (m[0].group_metadata)
                return m[0];

            var received = _.filter(m, function (message) {
                if(message.sender_id === $window.sessionStorage.user_id)
                    return false;

                return true;
            });

            return received[0];
        };

        function record() {
            $('#pulses').fadeIn(100);
            $('.swimlane-area').fadeOut(250);
            $('.video-container').fadeOut(250);
            $('.minimum-video').get(0).pause();
            $('.dog-emoji').fadeIn(250);

        }

        function stop_recording() {
            $('#pulses').fadeOut(1000);
            $('.swimlane-area').fadeIn(500);
            $('.video-container').fadeIn(500);
            $('.dog-emoji').fadeOut(250);

            if(!video_ended)
                $('.minimum-video').get(0).play();
        }

        $scope.selected_swimlane_index = function (s) {
            var current_swimlane = $scope.swimlanes.find(find_current_swimlane);
            return s === current_swimlane.swimlane_index ? "swimlane-current-pill" : "";
        };

        function find_current_swimlane(swimlane) {
            return swimlane.message_index === $scope.current_index;
        }

        $scope.reload = function () {
            load_messages($window.sessionStorage.user_id, $scope, $http);
        }

    });


function define_contact_methods($scope) {
    $scope.get_name = function (m) {
        return m.group_metadata ? m.group_metadata.name : m.sender_metadata.name;
    };

    $scope.get_company = function (m) {
        return m.group_metadata ? "" : m.sender_metadata.company;
    };

    $scope.get_photo = function (m) {
        return m.group_metadata ? m.group_metadata.photo_url : m.sender_metadata.photo_url;
    };

    $scope.date = function (date) {
        var minutes = Math.floor((new Date().getTime() - date + timezone)/1000/60);

        if(minutes < 60)
            return minutes + "m";

        var hours = Math.floor(minutes / 60);

        if(hours < 24)
            return  hours + "h";

        var days = Math.floor(hours / 24);

        if(days === 1)
            return "Yesterday";

        return  days + "d";
    };
}

function load_messages (user_id, $scope, $http) {
    console.log(user_id);
    $http.get('/v0.0/messages?normalized=true&recipient_id='+user_id).then(function (data) {
        if(data && data.data){

            var response = data.data.data.messages;

            console.log(response);

            var sorted_messages = [];

            _.forEach(response, function (messages, user_id) {
                var messages_array = [];
                _.forEach(messages, function (message) {

                    // TODO SUPPORT PHOTOS
                    if(message.mov_url)
                        messages_array.push(message);

                });

                messages_array.sort(function (b,a) {
                    return a.created_at - b.created_at;
                });

                if ($scope.count_received(messages_array)) {
                    sorted_messages.push(messages_array);
                }
            });

            sorted_messages.sort(function (b,a) {
                return a[0].created_at - b[0].created_at;
            });

            $scope.messages = sorted_messages;

            $(".login-pane").fadeOut(500, function () {
                $(".messages-pane").fadeIn(500)
            });

        } else {
            alert("nah");
        }

    }).catch(function (err) {

        alert("nah");

    });
}

function get_start($scope) {
    return 0;
}

function next_index($scope) {
    $scope.next_index = $scope.current_messages[$scope.current_index - 1] ? $scope.current_index - 1 : $scope.current_index;
    return $scope.next_index;
}

function prev_index($scope) {
    $scope.prev_index = $scope.current_messages[$scope.current_index + 1] ? $scope.current_index + 1 : $scope.current_index;
    return $scope.prev_index;
}

function swimlane_middle(message_index, sender) {
    return {
        type: "swimlane-middle-pill",
        origin: (sender ? "swimlane-sent-pill" : "swimlane-received-pill"),
        message_index: message_index
    }
}

function swimlane_left(message_index, sender) {
    return {
        type: "swimlane-left-pill",
        origin: (sender ? "swimlane-sent-pill" : "swimlane-received-pill"),
        message_index: message_index
    }
}

function swimlane_right(message_index, sender) {
    return {
        type: "swimlane-right-pill",
        origin: (sender ? "swimlane-sent-pill" : "swimlane-received-pill"),
        message_index: message_index
    }
}

function swimlane_full(message_index, sender) {
    return {
        type: "swimlane-full-pill",
        origin: (sender ? "swimlane-sent-pill" : "swimlane-received-pill"),
        message_index: message_index
    }
}

function swimlane_gap(message_index, sender) {
    return {
        type: "swimlane-gap",
        origin: (sender ? "" : ""),
        message_index: -1
    }
}
