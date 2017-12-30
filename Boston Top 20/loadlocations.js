var pg              = require('pg'),
    url             = require('url'),
    SocksConnection = require('socksjs'),
    _        = require('underscore'),
    async    = require('async'),
    simpledb = require('mongoose-simpledb');

var Config = require("./config");

var proxy    = url.parse(Config.pg_db.static_url);

var sock_options = {
    host: proxy.hostname,
    port: 1080,
    user: proxy.auth.split(':')[0],
    pass: proxy.auth.split(':')[1]
};

var remote_options = {
    host: Config.pg_db.host,
    port: Config.pg_db.port
};

var sockConn = new SocksConnection(remote_options, sock_options);

var config = {
    user:     Config.pg_db.user,
    database: Config.pg_db.database,
    password: Config.pg_db.password,
    stream:   sockConn
};

var client = new pg.Client(config);

var mongo_uri = Config.mongo_db.mongoUri;

var BLOCKED_AGENTS = ["TM301863", "CT003909", "NB112114", "H1111111"];

var end = "9-30-2017", one = "9-1-2017", three = "7-1-2017", six = "4-1-2017", twelve = "9-30-2016";

var dates = {
    1: one,
    3: three,
    6: six,
    12: twelve
};

// connect to our database
client.connect(function (err) {
    if (err) throw err;

    console.log("PG Database Connected");

    simpledb.init({
            connectionString: mongo_uri
        },
        function (err) {

            if (err) {
                console.error(err);
            }

            console.log("Mongo DB Connected");

            load_lists();
        });
});

function load_lists() {

    var List  = simpledb.db.List;
    var Agent = simpledb.db.Agent;

    console.time("List calculations complete");

    List.find({}).populate('list.agent', null, "Agent").exec(function (err, lists) {

        async.eachLimit(lists, 300, function (list, cb) {

            top_list(list, Agent, list.area, dates[list.time], end, cb);

        }, function (err) {
            console.timeEnd("List calculations complete");
        });

    });
}

function top_list (list, Agent, location, start, end, cb) {

    var query = "(SELECT sold_price, selling_agent_id, listing_agent_id, property_type, square_feet, selling_agent_name, agent_name" +
                " FROM ma_mlspin_properties WHERE listing_status='Sold'" +
                " AND city='" + location + "'" +
                " AND (sold_date >='" + start + "' AND sold_date <='" + end + "'))";

    client.query(query, function (err, row) {

        var top_list = calculate_volumes(row.rows);

        var top_selling_single = sort_values(top_list, 'selling', 'SINGLE FAMILY').splice(0,5);
        var top_selling_multi  = sort_values(top_list, 'selling', 'MULTI-FAMILY').splice(0,5);
        var top_selling_condo  = sort_values(top_list, 'selling', 'CONDOMINIUM/CO-OP').splice(0,5);

        var top_listing_single = sort_values(top_list, 'listing', 'SINGLE FAMILY').splice(0,5);
        var top_listing_multi  = sort_values(top_list, 'listing', 'MULTI-FAMILY').splice(0,5);
        var top_listing_condo  = sort_values(top_list, 'listing', 'CONDOMINIUM/CO-OP').splice(0,5);

        var top_all_all = consolidate_lists([top_selling_single,
            top_selling_multi,
            top_selling_condo,
            top_listing_single,
            top_listing_condo,
            top_listing_multi])
            .splice(0,5);

        save_list(Agent, top_all_all, list, cb);

    });
}

function save_list(Agent, top, list, cb) {
    async.map(top, function (t, callback) {
        var agent = t[0];
        var volume = t[1];

        Agent.findOne({MLS: agent}).exec(function (err, a) {

            if (!a){

                console.log("New agent for " + list.area);

                var a = new Agent();

                a.name = t[5];
                a.MLS = agent;
                a.url = "/img/4.png";

                a.save(function (err) {
                    callback(null, {agent: a._id, volume: volume})
                });

            } else {

                if (!a.url) {

                    console.log("Add image");

                    a.url = "/img/4.png";

                    a.save();
                }

                agent = a._id;
                callback(null, {agent: agent, volume: volume})
            }
        });

    }, function (err, top20) {

        list.sort_by = "city";
        list.list = top20;
        list.date = new Date();
        list.calculated = list.date.getTime();

        list.save(function (err) {

            cb(null);

        });

    });
}

function calculate_volumes(properties) {

    var list = {};

    _.each(properties, function (property) {

        var sold_price       = get_sold_price(property.sold_price);
        var selling_agent_id = property.selling_agent_id.toUpperCase();
        var listing_agent_id = property.listing_agent_id.toUpperCase();
        var property_type    = property.property_type.toUpperCase();
        var square_feet      = property.square_feet;
        var selling_name     = property.selling_agent_name;
        var listing_name     = property.agent_name;

        set_data(list, selling_agent_id, 'selling', property_type, sold_price, square_feet, selling_name);
        set_data(list, listing_agent_id, 'listing', property_type, sold_price, square_feet, listing_name);

    });

    return list;
}

function calculate_value(agent) {

    var norm_volume          = agent.volume/1000000;
    var norm_square_feet     = agent.avg_square_feet/100;
    var norm_units           = agent.units/10;

    return ( (norm_square_feet * 0.75) + (norm_volume * 0.25) + (norm_units * 0.0)) * 10;
}

function sort_values(list, agent_side, property_type) {
    var filtered_list = [];

    _.forEach(list, function (agent, agent_id) {

        if (!agent[agent_side])
            return;

        if (!agent[agent_side][property_type])
            return;

        var value           = agent[agent_side][property_type]['value'];
        var volume          = agent[agent_side][property_type]['volume'];
        var units           = agent[agent_side][property_type]['units'];
        var square_feet     = agent[agent_side][property_type]['square_feet'];
        var avg_square_feet = agent[agent_side][property_type]['avg_square_feet'];

        filtered_list.push([value, agent_id, agent.name, volume, units, square_feet, avg_square_feet]);

    });

    filtered_list = filtered_list.sort(function(a, b) {
        return b[0] - a[0];
    });

    return filtered_list;
}

function get_sold_price(sold_price) {

    var re = new RegExp(",", 'g');

    sold_price = sold_price.replace('$','').replace(re, '').replace('.00','');
    sold_price= parseInt(sold_price);

    if (sold_price > 1000000000)
        sold_price = sold_price/1000;

    return sold_price;
}

function set_data(list, agent_id, agent_side, property_type, sold_price, square_feet, name) {

    if (BLOCKED_AGENTS.indexOf(agent_id) !== -1)
        return;

    if (!square_feet)
        return;

    list[agent_id]                            = list[agent_id]                            || {};
    list[agent_id]['name']                    = name;
    list[agent_id][agent_side]                = list[agent_id][agent_side]                || {};
    list[agent_id][agent_side][property_type] = list[agent_id][agent_side][property_type] || {};

    list[agent_id][agent_side][property_type]['volume']       = (list[agent_id][agent_side][property_type]['volume'] || 0) + sold_price;
    list[agent_id][agent_side][property_type]['units']        = (list[agent_id][agent_side][property_type]['units']  || 0) + 1;
    list[agent_id][agent_side][property_type]['square_feet']  = (list[agent_id][agent_side][property_type]['square_feet']  || 0) + square_feet;

    var units = list[agent_id][agent_side][property_type]['units'];

    var avg_square_feet = list[agent_id][agent_side][property_type]['avg_square_feet'] || 1;

    avg_square_feet = avg_square_feet * (units - 1);
    avg_square_feet += sold_price/square_feet;
    avg_square_feet = sold_price/square_feet/units;

    console.log(square_feet, avg_square_feet, sold_price, property_type);

    list[agent_id][agent_side][property_type]['avg_square_feet']  = avg_square_feet;

    list[agent_id][agent_side][property_type]['value'] = calculate_value(list[agent_id][agent_side][property_type]);
}

function consolidate_lists(lists) {

    var consolidated_list = {};

    _.each(lists, function (list) {
       _.each(list, function (data) {
           consolidated_list[data[1]]                 = consolidated_list[data[1]] || {};
           consolidated_list[data[1]].value           = (consolidated_list[data[1]].value || 0) + data[0];
           consolidated_list[data[1]].volume          = (consolidated_list[data[1]].volume || 0) + data[3];
           consolidated_list[data[1]].units           = (consolidated_list[data[1]].units || 0) + data[4];
           consolidated_list[data[1]].square_feet     = (consolidated_list[data[1]].square_feet || 0) + data[5];
           consolidated_list[data[1]].avg_square_feet = consolidated_list[data[1]].square_feet / consolidated_list[data[1]].units;

           consolidated_list[data[1]].name  = data[2];
       })
    });

    var filtered_list = [];

    _.forEach(consolidated_list, function (value, agent_id) {
        filtered_list.push([(3*Math.log(value.value)/Math.log(10)), agent_id, value.name, value.volume, value.units, value.square_feet, value.avg_square_feet]);
    });

    filtered_list = filtered_list.sort(function(a, b) {
        return b[0] - a[0];
    });

    return filtered_list;
}