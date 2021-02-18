const express       = require("express"),
      app           = express(),
      bodyParser    = require("body-parser"),
      mongoose      = require("mongoose"),
      passport      = require("passport"),
      LocalStrategy = require("passport-local"),
      passportLocalMongoose = require("passport-local-mongoose"),
      expressSession        = require("express-session"),
      connectMongo          = require("connect-mongo"),
      GoogleStrategy        = require("passport-google-oauth20"),
      fs = require('fs'),
      path = require('path'),
      multer = require('multer'),
      methodOverride = require('method-override'), //to use delete, put requests
      flash = require('connect-flash');

const User  = require("./models/user"),
      News  = require("./models/news"),
      Event = require("./models/event"),
      Admin = require("./models/admin");


/* Importing all routes */
const indexRoutes = require("./routes/index"),
      newsRoutes  = require("./routes/news"),
      eventRoutes = require("./routes/events"),
      adminRoutes = require("./routes/admin"),
      profileRoutes = require("./routes/profile");

require('dotenv').config()  // loading environment variables

/* start mongodb connection */
//for temp/ development purpose
let mongodbURL = process.env.MONGODB_SERVER == "local" ? "mongodb://localhost:27017/alumni_website" : process.env.MONGODB_URL;

mongoose.connect(mongodbURL , {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});

mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + mongodbURL);
}).on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
}).on('disconnected', function () {
    console.log('Mongoose default connection lost!');
});


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set("view engine", "ejs");      // required to use ejs
app.use(express.static(__dirname + "/public"));     // public directory to serve
app.use(methodOverride("_method"));
app.use(flash());


/* passport configuration */
const MongoStore = connectMongo(expressSession);    // for session storage
app.use(expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 3600000 * 24 * 7,
    }, //7days // set "secure:true" only when using https
    store: new MongoStore({ mongooseConnection: mongoose.connection }) // may be more configuration in future
}));


/* Multer configuration */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
const upload = multer({ storage: storage });


app.use(passport.initialize());
app.use(passport.session());

passport.use('user', new LocalStrategy(User.authenticate()));   // Local login User
passport.use('admin', new LocalStrategy(Admin.authenticate()));     // Local login Admin


/* for google login */
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_OAUTH_CALLBACK
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
                firstName: profile._json.given_name,
                lastName: profile._json.family_name,
                username: profile._json.email,
                googleId: profile.id,
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


// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function (user, done) {
    user={
        _id: user._id,
        username :user.username,
        firstName: user.firstName,
        role: user.role
    }
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    if (user != null)
    done(null, user);
});

/* middleware to pass logged in user to every route */
app.use(function(req, res, next){
    res.locals.loggedInUser = req.user;

    res.locals.successMessage = req.flash("successMessage");
    res.locals.errorMessage = req.flash("errorMessage");

    next();
});


/* using data from data/data.json */
const rawdata = fs.readFileSync('./data/data.json');
global.static_data = JSON.parse(rawdata);


/* using all routes */
app.use(indexRoutes);
app.use(newsRoutes);
app.use(eventRoutes);
app.use(adminRoutes);
app.use(profileRoutes);



app.get('/*', function(req, res){
    res.send(`
    <h1>Error 404</h1>
    <h3>Are you lost?!</h3>
    <a href="/">Go Home</a>
    `)
});

const port = process.env.PORT

// for dev purposes
let ip = process.env.PLATFORM == "mobile" ? "0.0.0.0" : process.env.IP

app.listen(port, ip, function(){
    // console.log("Environment: ",process.env.Node_ENV);
    console.log("Server is running...");
    console.log("Go to " + ip + ":" + port);
});

/* create test admin */
if(process.env.CREATE_TEST_ADMIN == "true") {
    const adminUsername = "admin", adminPassword = "admin";

    Admin.register(new Admin({ username: adminUsername, createdBy: "1st Admin" }), adminPassword, function (err, user) {
        if (err) {
            if(err.name == "UserExistsError")
                console.log("Test Admin with that USERNAME is already present!");
            else
                console.log(err);
        } else
            console.log(`1st ADMIN created with- USERNAME: ${adminUsername} and PASSWORD: ${adminPassword}`);
    });
}