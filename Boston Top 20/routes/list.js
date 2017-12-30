var List = require("mongoose-simpledb").db.List;
var Blog = require("mongoose-simpledb").db.Blog;

var _ = require('underscore');
var locs = require("../locations/data").sort();

module.exports = function (app) {

    app.get("/api/list/:location/:months", function (req, res) {
        List.findOne({area: req.params.location, time: req.params.months}).populate('list.agent',null,"Agent")
            .exec(function (err,list) {
                if(err)
                    return res.json({success: false, err:err});

                if(!list || !list.list || list.list.length == 0)
                    return res.json({success: false});


                list = _.map(list.list,function (l) {
                    return {
                        name: l.agent.name,
                        id: l.agent._id,
                        url: l.agent.url
                    }
                });

                list = _.sortBy(list, function (l) {
                    return -1*l.volume;
                });
                
                return res.json({success: true, list: list});
            })
    });

    app.get("/api/agent/:location/:id", function (req, res) {
        List.find({area: req.params.location}).populate('list.agent',null,"Agent")
            .exec(function (err,list) {

                list = _.map(list, function (l) {
                    var ids = _.pluck(_.pluck(l.list,"agent"),"_id");

                    ids = _.map(ids, function (i) {
                        return i.toString();
                    });

                    if(_.contains(ids,req.params.id)){
                        var index = ids.indexOf(req.params.id);

                        return {
                            rank: index,
                            month: l.time,
                            list: l.list[index]
                        };
                    } else {
                        return null;
                    }
                });

                list = _.filter(list, function (l) {
                    return l != null;
                });

                if(err || list.length == 0)
                    return res.json({success: false, err: err, list: []});

                var agent = list[0].list.agent;

                return res.json({
                    success: true,
                    list: list,
                    agent: agent
                });
            })
    });

    app.get("/api/blog/delete/:url", function (req, res) {
        Blog.findOne({url: req.params.url})
            .exec(function (err,blog) {
                if(err)
                    return res.json({success: false, err:err});

                if(!blog)
                    return res.json({success: false});

                blog.remove(function () {
                    return res.json({success: true});
                });
            });
    });
    
    app.get("/api/locations", function (req, res) {
        return res.json(locs);
    });

    app.get("/api/locations/html", function (req, res) {
        return res.json(locs_html);
    });

    app.get("/api/left", function (req, res) {
        var end    = new Date(2017, 3, 30, 0, 0, 0, 0).getTime();
        console.log(new Date(2017, 3, 30, 0, 0, 0, 0));
        List.find({calculated: { $lt: end }})
            .exec(function (err,lists) {
                return res.json({left: lists.length});
            });
    });
};

var locs_html = "";

_.each(locs, function (loc) {
    locs_html = locs_html + '<option value="'+loc+'">'+loc+'</option>'
});
