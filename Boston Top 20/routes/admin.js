var Blog = require("mongoose-simpledb").db.Blog;

module.exports = function (app) {
    app.get("/admin/*", function(req,res){
        res.render('extra');
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

    app.get("/api/admin/blogs", function (req, res) {
        Blog.find({}).sort({date:-1})
            .exec(function (err,blogs) {
                if(err)
                    return res.json({success: false, err:err});

                if(!blogs)
                    return res.json({success: false});

                return res.json({success: true, blogs: blogs});
            })
    });

    app.post("/api/blog/new", function (req, res) {
        var blog = new Blog();

        blog.title = req.body.title;
        blog.url = req.body.title.split(" ").join("-").split("--").join("-").split("--").join("-").toLocaleLowerCase();
        blog.date = req.body.time;

        blog.text = req.body.text;

        blog.save(function (err) {
            res.json({
                success: true
            });
        });

    });

    app.post("/api/blog/edit", function (req, res) {

        Blog.findOne({url: req.body.url})
            .exec(function (err,blog) {
                if(err)
                    return res.json({success: false, err:err});

                if(!blog)
                    return res.json({success: false});

                blog.title = req.body.title;
                blog.date = req.body.time;
                blog.text = req.body.text;

                blog.save(function (err) {
                    res.json({
                        success: true
                    });
                });
            });

    });
};


