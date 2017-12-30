var Blog = require("mongoose-simpledb").db.Blog;

module.exports = function (app) {

    app.get("/api/blogs", function (req, res) {
        Blog.find({date:{$lt: new Date().getTime()}}).sort({date:-1})
            .exec(function (err,blogs) {
                if(err)
                    return res.json({success: false, err:err});

                if(!blogs)
                    return res.json({success: false});

                return res.json({success: true, blogs: blogs});
            })
    });

    app.get("/api/blog/:url", function (req, res) {
        Blog.findOne({url: req.params.url})
            .exec(function (err,blog) {
                if(err)
                    return res.json({success: false, err:err});

                if(!blog)
                    return res.json({success: false});

                return res.json({success: true, blog: blog});
            });
    });

};