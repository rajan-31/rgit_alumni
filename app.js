const express       = require("express"),
        app         = express(),
        bodyParser  = require("body-parser"),
        mongoose    = require("mongoose");

mongoose.connect("mongodb+srv://admin:mongo001@cluster0.sv0df.mongodb.net/alumni_website?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// SCHEMAS
const showcaseSchema = new mongoose.Schema({
    title: String,
    image: String
});

const Showcase = mongoose.model("Showcase", showcaseSchema);

const newsSchema = new mongoose.Schema({
    title: String,
    image: String,
    description: String
});

const News = mongoose.model("News", newsSchema);

app.get("/", function(req, res){
    res.redirect("/home");
});

app.get("/home", function(req, res){
    // retrive showcases from mongo
    Showcase.find({}, function(err, allShowcases){
        if(err){
            console.log(err);
        } else {
            res.render("home", {showcases: allShowcases});
        }
    }).sort( { title : 1 } );
});

app.post("/showcase", function(req, res){
    const title = req.body.title;
    const image = req.body.image;
    const newShowcase = {title: title, image: image};
    // crete & save to mongo
    Showcase.create(newShowcase, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else{
            res.redirect("/");
        }
    });
});

app.get("/showcase/new", function(req, res){
    res.render("newShowcase");
});

app.get("/news", function(req, res){
    News.find({}, function(err, allNews){
        if(err){
            console.log(err);
        } else {
            res.render("news", {news: allNews});
        }
    });
});

app.post("/news", function(req, res){
    const title = req.body.title;
    const image = req.body.image;
    const desc = req.body.desc;
    const newNews = {title: title, image: image, description: desc};
    // crete & save to mongo
    News.create(newNews, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else{
            res.redirect("/news");
        }
    });
});

app.get("/news/new", function(req, res){
    res.render("newNews");
});

// this route is last in news because it will accept anything after "/news/" that means "new" also
app.get("/news/:id", function(req, res){
    //to get item by id
    News.findById(req.params.id, function(err, foundNews){
        if(err){
            console.log(err);
        } else{
            res.render("showNews", {news: foundNews});
        }
    });

});

app.get("/events", function(req, res){
    res.render("events");
});

var port = 8080 // process.env.PORT;
var ip = "localhost" // process.env.IP;
app.listen(port, ip, function(){
    console.log("Server is running...", "\n" + ip + ":" + port);
});