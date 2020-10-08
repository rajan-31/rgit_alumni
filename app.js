const express         = require("express"),
        app           = express(),
        bodyParser    = require("body-parser"),
        mongoose      = require("mongoose"),
        passport      = require("passport"),
        LocalStrategy = require("passport-local"),
        passportLocalMongoose = require("passport-local-mongoose"),
        expressSession        = require("express-session"),
        connectMongo          = require("connect-mongo"),
        User        = require("./models/user"),
        Showcase    = require("./models/showcase"),
        News        = require("./models/news") ;

/*
 * body-parser :to get data of request in expected format....
 like if we want to use username=req.body.username when a form is submitted to post route !!! without body-parse that attribute will be empty
 google it
 * 
*/

mongoose.connect("mongodb+srv://admin:mongo001@firstcluster.rxwyk.mongodb.net/alumni_website?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(bodyParser.urlencoded({extended: true}));
// required so to use ejs
app.set("view engine", "ejs");

// passport configuration
// session storage
const MongoStore = connectMongo(expressSession);
app.use(expressSession({
    secret: "secrettttttttttt",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }) // may be more configuration in future
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// to pass logged in user to every route
app.use(function(req, res, next){
    res.locals.loggedInUser = req.user;
    next();
});


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
    }).sort( { title : 1 } ); // sort in ascending order of title
});

// to insert new showcase in db
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

app.get("/news", isLoggedIn, function(req, res){
    News.find({}, function(err, allNews){
        if(err){
            console.log(err);
        } else {
            res.render("news", {news: allNews});
        }
    });
});

// to insert new news in db
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

// this route is after /news/new because it will accept anything after "/news/" that means "new" also which will make /news/new useless
app.get("/news/:id", isLoggedIn, function(req, res){
    //to get item by id
    News.findById(req.params.id, function(err, foundNews){
        if(err){
            console.log(err);
        } else{
            res.render("showNews", {news: foundNews});
        }
    });

});

app.get("/events", isLoggedIn, function(req, res){
    res.render("events");
});

////////////////////////////
// Authorization Routes
app.get('/signup', function(req, res){
    res.render("signup")
});

app.post('/signup', function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("signup");
        }
        // use loacl strategy
        passport.authenticate("local")(req, res, function(){
            res.redirect("/");      // change this in future
        });
    });
});

app.get('/login', function(req, res){
    res.render("login");
});

app.post('/login', passport.authenticate("local", {
    successRedirect: "/",       // change this in future
    failureRedirect: "/login"
}), function(req, res){
    
});

/////////////////////////////////
// logout
app.get('/logout', function(req, res){
    req.logout();
    res.redirect("/");
});

// middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

var port = 8080 // process.env.PORT;
var ip = "localhost" // process.env.IP;
app.listen(port, ip, function(){
    console.log("Server is running...", "\n" + ip + ":" + port);
});