"use strict";

var MINIMUM_PURPLE = "#5736da";

minimum_dashboard

    .config(function($routeProvider) {

        $routeProvider

            .when('/admin/messages', {
                templateUrl : 'pages/messages/index.html',
                controller: 'MessageController',
                // resolve: { loggedin: loggedIn }
            })

            .when('/admin/messages/:receiver_id', {
                templateUrl : 'pages/messages/conversations.html',
                controller: 'MessageController',
                // resolve: { loggedin: loggedIn }
            })

            .when('/admin/messages/:receiver_id/:sender_id', {
                templateUrl : 'pages/messages/conversation.html',
                controller: 'MessageController',
                // resolve: { loggedin: loggedIn }
            });
    })

    .controller('MessageController', function($scope, $rootScope, $http, $location, DTOptionsBuilder, $routeParams, $sce, $timeout, messages) {

        if(!$routeParams.receiver_id && !$routeParams.sender_id) {

            messages.get_stats(function (data) {
                $scope.dtOptions = DTOptionsBuilder.newOptions()
                    .withDisplayLength(20)
                    .withOption('bLengthChange', false);

                if($location.$$path === "/admin/messages"){
                    $timeout(function(){
                        $scope.loaded_users = _.values(data);
                        $('#table').fadeIn("medium");
                        $('.loading').fadeOut("medium");
                    });
                }
            });

        }

        $scope.filter_daily = function () {
            reset_colors();
            $scope.order = $scope.order === '-this[1].past_24_hour' ? 'this[1].past_24_hour' : '-this[1].past_24_hour';
            var classes = ["glyphicon-arrow-down", "glyphicon-arrow-up"];
            if($scope.order.indexOf("-") !== -1) classes.reverse();

            $(".daily").removeClass(classes[0]).addClass(classes[1]);

            $(".daily_sort").css("color", MINIMUM_PURPLE);
        };

        $scope.filter_today = function () {
            reset_colors();
            $scope.order = $scope.order === '-this[1].total' ? 'this[1].total' : '-this[1].total';
            var classes = ["glyphicon-arrow-down", "glyphicon-arrow-up"];
            if($scope.order.indexOf("-") !== -1) classes.reverse();

            $(".today").removeClass(classes[0]).addClass(classes[1]);

            $(".today_sort").css("color", MINIMUM_PURPLE);
        };

        $scope.filter_name = function () {
            reset_colors();
            $scope.order = $scope.order === '-this[1].user.name' ? 'this[1].user.name' : '-this[1].user.name';
            var classes = ["glyphicon-arrow-down", "glyphicon-arrow-up"];
            if($scope.order.indexOf("-") !== -1) classes.reverse();

            $(".name_order").removeClass(classes[0]).addClass(classes[1]);

            $(".name_sort").css("color", MINIMUM_PURPLE);
        };

        $scope.filter_name();

        $scope.is_contact = function (user_id) {
            return $scope.contacts.indexOf(user_id) !== -1;
        };

        if($routeParams.receiver_id && !$routeParams.sender_id){

            $http.get('/admin/api/users/' + $routeParams.receiver_id).then(function(data){
                $scope.receiver = data.data;
            });

            $http.get('/v0.0/admin/api/messages/stats/'+ $routeParams.receiver_id).then(function(data){

                var tmp = [];

                _.forEach(data.data, function (value, user_id) {
                    tmp.push([user_id, value]);
                });

                $scope.conversations = tmp;
                $scope.done_loading = true;
                $(".loading").fadeOut("slow");

            });

            $http.get('v0.0/contacts/'+ $routeParams.receiver_id).then(function(data){
                $scope.contacts = _.keys(data.data.data.contacts);
            });

        }

        if($routeParams.receiver_id && $routeParams.sender_id){
            $http.get('/admin/api/users/' + $routeParams.sender_id).then(function(data){
                $scope.sender = data.data;
            });

            $http.get('/admin/api/users/' + $routeParams.receiver_id).then(function(data){
                $scope.receiver = data.data;
            });

            $http.get('/v0.0/messages?limit=60&recipient_id='+$routeParams.receiver_id+"&sender_id="+$routeParams.sender_id).then(function(data){
                $scope.conversations = data.data;

                if(data && data.data){

                    var messages = data.data.data.messages;

                    var sorted_messages = [];

                    _.forEach(messages, function (message) {

                        // TODO SUPPORT PHOTOS
                        if(message.mov_url)
                            sorted_messages.push(message);

                    });

                    sorted_messages.sort(function (a,b) {
                        return a.created_at - b.created_at;
                    });

                    $scope.messages = sorted_messages;

                    $(".loading").fadeOut("slow");
                    $(".swimlane-area").fadeIn("slow");

                    if (sorted_messages.length !== 0 ) {
                        calculate_swimlanes();
                    } else {
                        $(".no-video-messages").fadeIn("slow");
                    }

                } else {
                    console.log("nah");
                }
            });
        }

        $scope.safe_url = function (url) {
            return $sce.trustAsResourceUrl(url);
        };

        $scope.pretty = function (date) {
            return moment(date).format("h:mm a");
        };

        $scope.professional = function (date) {

            date = date.split("-");

            return moment(new Date("20"+date[2],date[0]-1,date[1],0,0,0,0)).format("dddd, MMMM Do YYYY");
        };

        $scope.count = function (obj) {
            if (!obj)
                return 0;
            return _.keys(obj) ? _.keys(obj).length : 0;
        };

        $scope.average = function (user_id) {
            return $scope.averages[user_id];
        };

        $scope.start_modal = function (message_index) {
            $scope.modal_data = $scope.messages[message_index];
            $scope.current_index = message_index;

            open_modal();
        };

        function calculate_swimlanes() {
            var messages        = $scope.messages;
            var current_user_id = $routeParams.receiver_id;

            var all_swimlanes = [];
            var week = 0;

            for ( var i = 0; i < messages.length ; i++ ) {

                var sender = messages[i].sender_id;

                var current_message = messages[i];
                var next_message    = messages[i + 1] || null;
                var prev_message    = messages[i - 1] || null;

                var day_of_the_week      = new Date(current_message.created_at).getDay();
                var day_of_the_week_prev = prev_message ? new Date(prev_message.created_at).getDay() : null;
                var day_of_the_week_next = next_message ? new Date(next_message.created_at).getDay() : null;

                if(prev_message){

                    /*if(day_of_the_week < day_of_the_week_prev){
                        if(all_swimlanes[week][all_swimlanes[week].length-1].type === "swimlane-middle-pill"){

                            var sender = all_swimlanes[week][all_swimlanes[week].length-1].origin === "swimlane-sent-pill";

                            all_swimlanes[week].push(swimlane_right(i-1, sender));
                            all_swimlanes[week].push(swimlane_gap(i-1, sender));

                            all_swimlanes[week+1] = all_swimlanes[week+1] || [];

                            sender = all_swimlanes[week+1][all_swimlanes[week+1].length-1].origin === "swimlane-sent-pill";

                            all_swimlanes[week+1].push(swimlane_left(i, sender));
                        }
                    }*/

                    week += day_of_the_week < day_of_the_week_prev ? 1 : 0;
                }

                var swimlanes = all_swimlanes[week] || [];

                if (sender === current_user_id ) { // S

                    if ( next_message && next_message.sender_id === current_user_id && next_message.created_at + 6*1000*60 > current_message.created_at) { // SS

                        if ( prev_message && prev_message.sender_id === current_user_id && prev_message.created_at - 6*1000*60 < current_message.created_at) { // SSS
                            swimlanes.push(swimlane_middle(i, true));

                            if(day_of_the_week_next < day_of_the_week || ((next_message.created_at - 24*6*60*1000*60) > current_message.created_at)){
                                swimlanes.push(swimlane_right(i, true));
                                swimlanes.push(swimlane_gap(i, true));

                                all_swimlanes[week+1] = all_swimlanes[week+1] || [];

                                all_swimlanes[week+1].push(swimlane_left(i+1, true));
                            }

                        } else { // SSR
                            swimlanes.push(swimlane_left(i, true));
                            swimlanes.push(swimlane_middle(i, true));
                        }

                    } else { // SR

                        if ( prev_message && prev_message.sender_id === current_user_id && prev_message.created_at - 6*1000*60 < current_message.created_at) { // SRS
                            swimlanes.push(swimlane_middle(i, true));
                            swimlanes.push(swimlane_right(i, true));
                        } else { // SRR
                            swimlanes.push(swimlane_full(i, true));
                        }
                    }
                } else { // R
                    if ( next_message && next_message.sender_id !== current_user_id && next_message.created_at + 6*1000*60 > current_message.created_at) { // RR

                        if ( prev_message && prev_message.sender_id !== current_user_id && prev_message.created_at - 6*1000*60 < current_message.created_at) { // RRR

                            swimlanes.push(swimlane_middle(i, false));

                            if(day_of_the_week_next < day_of_the_week || next_message.created_at - 24*6*60*1000*60 > current_message.created_at){
                                console.log(day_of_the_week, day_of_the_week_next, day_of_the_week_prev);
                                swimlanes.push(swimlane_right(i, false));
                                swimlanes.push(swimlane_gap(i, false));

                                all_swimlanes[week+1] = all_swimlanes[week+1] || [];

                                all_swimlanes[week+1].push(swimlane_left(i+1, false));
                            }
                        } else { // RRS
                            swimlanes.push(swimlane_left(i, false));
                            swimlanes.push(swimlane_middle(i, false));
                        }

                    } else { // RS

                        if ( prev_message && prev_message.sender_id !== current_user_id && prev_message.created_at - 6*1000*60 < current_message.created_at) { // RSR

                            swimlanes.push(swimlane_middle(i, false));
                            swimlanes.push(swimlane_right(i, false));
                        } else { // RSS
                            if ( prev_message && prev_message.sender_id !== current_user_id && prev_message.created_at - 60*1000*60 > current_message.created_at)
                                swimlanes.push(swimlane_gap(i, false));

                            swimlanes.push(swimlane_full(i, false));
                        }
                    }
                }

                all_swimlanes[week] = swimlanes;
            }

            var swimlane_index = 0;

            for ( i = 0; i < swimlanes.length ; i++ ) {
                if(swimlanes[i].type === "swimlane-left-pill" || swimlanes[i].type === "swimlane-full-pill")
                    swimlanes[i].swimlane_index = swimlane_index++;
                else
                    swimlanes[i].swimlane_index = swimlane_index;
            }

            $scope.all_swimlanes = all_swimlanes.reverse();
        }

        $scope.next = function () {
            if($scope.messages[$scope.current_index+1])
                return $scope.modal_data = $scope.messages[++$scope.current_index];
        };

        $scope.prev = function () {
            if($scope.messages[$scope.current_index-1])
                return $scope.modal_data = $scope.messages[--$scope.current_index];
        };

        $scope.beginning_week_date = function (date) {
            date = new Date(date);
            date = new Date(date.getTime()-date.getDay()*24*60*60*1000);
            return moment(date.getTime()).format("MMM. D");
        };

        $scope.week_number = function (date) {
            return new Date(date).getDay();
        };

        function open_modal() {
            $('#video-player').modal({
                show: true,
                keyboard: true
            });

            $('#modal-video').on('ended', function () {
                $scope.next();
                $scope.$apply();
            });

            $(document).keydown(function(e){
                if (e.keyCode === 37) { //left
                    $scope.prev();
                    $scope.$apply();
                    return false;
                }
            });

            $(document).keydown(function(e){
                if (e.keyCode === 39) { //right
                    $scope.next();
                    $scope.$apply();
                    return false;
                }
            });

            $('#video-player').on('hidden.bs.modal', function () {

                $scope.modal_data = {
                    mov_url: "",
                    speech_text: "",
                    photo_url: "",
                    date: new Date(),
                    left: true,
                    right: true,
                    conversation_index: 0,
                    message_index: 0
                };

                $scope.$apply();
            });
        }

        $scope.message_date = function (date) {
            date = new Date(date);
            return moment(date.getTime()).format("MMM. D");
        };

        $scope.get_hashtags = function (keywords) {

            var hashtags = [];

            _.each(keywords, function (key) {
                hashtags.push(key.text.split(" ").join("").toLowerCase());
            });

            hashtags = _.union([""], _.uniq(hashtags));

            hashtags = hashtags.join(" #").trim();

            return hashtags;
        }

    })

    .filter('order', function() {
        return function(items) {

            if(!items)
                return items;

            var keys = _.keys(items).reverse();
            var vals = _.values(items).reverse();

            vals.sort(function (a, b) {
                return a.created_at - b.created_at;
            });

            keys.sort(function (a, b) {
                return items[a].created_at - items[b].created_at;
            });

            var obj = {};

            keys.forEach(function(key, index) {
                obj[key] = vals[index];
            });

            return obj;
        };
    })

    .filter('daily', function() {
        return function(items, scope) {

            if(!items)
                return items;

            var sorted = items;

            sorted.sort(function (a,b) {
                return scope.order ? a[1].average - b[1].average : b[1].average - a[1].average;
            });

            return sorted;
        };
    })

    .filter('reverse', function() {
        return function(items) {

            var keys = _.keys(items).reverse();
            var vals = _.values(items).reverse();

            var obj = {};

            keys.forEach(function(key, index) {
                obj[key] = vals[index];
            });

            return obj;
        };
    });

function reset_colors() {
    var GREY = "#e0e0e0";
    $(".daily_sort").css("color", GREY);
    $(".today_sort").css("color", GREY);
    $(".name_sort").css("color",  GREY);

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
