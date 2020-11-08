const express         = require("express"),
        app           = express(),
        bodyParser    = require("body-parser"),
        mongoose      = require("mongoose"),
        passport      = require("passport"),
        LocalStrategy = require("passport-local"),
        passportLocalMongoose = require("passport-local-mongoose"),
        expressSession        = require("express-session"),
        connectMongo          = require("connect-mongo"),
        GoogleStrategy        = require("passport-google-oauth20"),
        User        = require("./models/user"),
        Showcase    = require("./models/showcase"),
        News        = require("./models/news"),
        Event       = require("./models/events"); // not set & not used yet

/*
 * body-parser :to get data of request in expected format....
 like if we want to use username=req.body.username when a form is submitted to post route !!! without body-parse that attribute will be empty
 google it
 * 
*/

/* Importing all routes */
const indexRoutes = require("./routes/index"),
        newsRoutes  = require("./routes/news"),
        eventRoutes = require("./routes/events");

require('dotenv').config()  // loading environment variables

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");      // required to use ejs

app.use(express.static(__dirname + "/public")); // public directory to serve

/* passport configuration */
const MongoStore = connectMongo(expressSession);    // for session storage
app.use(expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 * 24 * 15 }, //15days // set "secure:true" only when using https
    store: new MongoStore({ mongooseConnection: mongoose.connection }) // may be more configuration in future
}));
app.use(passport.initialize());
app.use(passport.session());

/* Local login */
passport.use(new LocalStrategy(User.authenticate()));
/* for google login */
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    callbackURL: "http://"+process.env.IP+":"+process.env.PORT+"/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        User.findOne({
            'googleId': profile.id
        }, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                user = new User({
                    username: profile.displayName,
                    googleId: profile.id
                    // more details can be taken
                });
                user.save(function (err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                return done(err, user);
            }
        });
    }
));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
/* middleware to pass logged in user to every route */
app.use(function(req, res, next){
    res.locals.loggedInUser = req.user;
    next();
});

/* using all routes */
app.use(indexRoutes);
app.use(newsRoutes);
app.use(eventRoutes);

const port = process.env.PORT;
const ip = process.env.IP;
app.listen(port, ip, function(){
    console.log("Server is running...", "\n" + ip + ":" + port);
});