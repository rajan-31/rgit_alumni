const express       = require("express"),
      app           = express(),
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
      flash = require('connect-flash'),
      
      helmet = require("helmet"),
      morgan = require("morgan"),
      nodeCache = require("node-cache"),
      compression = require("compression");

      const httpServer = require("http").createServer(app);
      const io = require("socket.io")(httpServer);

const User  = require("./models/user"),
      News  = require("./models/news"),
      Event = require("./models/event"),
      Admin = require("./models/admin"),
      Testimonial = require("./models/testimonial"),
      Data = require("./models/data")


/* Importing all routes */
const indexRoutes = require("./routes/index"),
      newsRoutes  = require("./routes/news"),
      eventRoutes = require("./routes/events"),
      adminRoutes = require("./routes/admin"),
      chatRoutes = require("./routes/chat"),
      profileRoutes = require("./routes/profile");

const logger = require("./configs/winston_config");
app.use(morgan(
    ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms ":referrer" ":user-agent"', 
    { stream: { write: message => logger.http(message.trim()) }}
));

require('dotenv').config();  // loading environment variables

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
    logger.info('Mongoose connection open to ' + mongodbURL);
}).on('error', function (err) {
    logger.error('Mongoose connection error: ' + err);
}).on('disconnected', function () {
    logger.error('Mongoose connection lost!');
});

/* gzip compression */
app.use(compression());

/* helmet config */
app.use(
    helmet.contentSecurityPolicy({
      directives: {
        'default-src': [ "'self'" ],//
        'base-uri': [ "'self'" ],//
        'connect-src': [ "'self'" ],//
        // 'block-all-mixed-content': [],
        'font-src': [ "'self'", 'https:', 'data:' ],//
        // 'frame-ancestors': [ "'self'" ],//
        'img-src': [ "'self'", 'data:', 'blob:' ],//
        'object-src': [ "'none'" ],//
        'script-src': [ "'self'", "'unsafe-inline'", "https://ajax.googleapis.com", "https://cdnjs.cloudflare.com" ],//
        // 'script-src-attr': [ "'unsafe-inline'", "https:" ],
        'style-src': [ "'self'", 'https:', "'unsafe-inline'" ],//
        'frame-src': [ "https://www.google.com" ],//
        // 'upgrade-insecure-requests': []//
      },
    })
);
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

/* end helmet config */

/* static content */
app.use("/assets/css", express.static(path.join(__dirname, "public", "assets", "css"), {
    etag: false,
    // maxAge: 1000 * 60 * 60   // 1 hr
}));
app.use("/assets/fonts", express.static(path.join(__dirname, "public", "assets", "fonts"), {
    etag: false,
    // maxAge: 1000 * 60 * 60 * 24 * 30 * 12  // 360 days
}));
app.use([/^\/assets\/img\/clients($|\/)/, /^\/assets\/img\/ui($|\/)/, "/assets/img" ], express.static(path.join(__dirname, "public", "assets", "img"), {
    etag: false,
    // maxAge: 1000 * 60 * 60 * 24 * 7   // 7 days
}));
app.use("/assets/img/clients", express.static(path.join(__dirname, "public", "assets", "img", "clients"), {
    etag: true,
    // maxAge: 1000 * 60 * 60   // 1 hr
}));
app.use("/assets/img/ui", express.static(path.join(__dirname, "public", "assets", "img", "ui"), {
    etag: true,
    // maxAge: 1000 * 60 * 60 * 24 * 7   // 7 days
}));
app.use("/assets/js", express.static(path.join(__dirname, "public", "assets", "js"), {
    etag: false,
    // maxAge: 1000 * 60 * 60   // 1 hr
}));

/* vendor files */
app.use("/assets/vendor", express.static(path.join(__dirname, "public", "assets", "vendor"), {
    etag: false,
    // maxAge: 1000 * 60 * 60 * 24 * 30 * 12  // 360 days
}));

/* uploaded files */
app.use("/images", express.static(path.join(__dirname, "uploads", "images"), {
    etag: false,
    // maxAge: 1000 * 60 * 60 * 24 * 7   // 7 days
}));


app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set("view engine", "ejs");      // required to use ejs
app.use(methodOverride("_method"));
app.use(flash());


/* passport configuration */
const MongoStore = connectMongo(expressSession);    // for session storage
const sessionMiddleware = expressSession({
    name: "sessionId",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 3600000 * 24 * 7,   //7days
        sameSite: "lax",
        // secure: true,   // set only when using https
        httpOnly: true
    }, 
    store: new MongoStore({ mongooseConnection: mongoose.connection }) // may be more configuration in future
});
app.use(sessionMiddleware);

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
    const imp_data = profile._json;
    User.findOne({
        $or: [
            { googleId: profile.id },
            { username: imp_data.email.toLowerCase() }
        ]
    }, 'firstName lastName username userType active',  function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            user = new User({
                firstName: imp_data.given_name,
                lastName: imp_data.family_name,
                username: imp_data.email,
                googleId: profile.id,
                active: true
                // more details can be taken
            });
            user.save(function (err) {
                if (err) logger.error(err);
                    return done(err, user);
            });
        } else {
            return done(err, user);
        }
    });
}
));


passport.serializeUser(function (user, done) {
    user = { _id: user._id, username :user.username, firstName: user.firstName, fullName: user.firstName + " " + user.lastName, role: user.role, active: user.active };
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


/* Socket.io events */
require("./configs/socketio-events.js")(io, User, sessionMiddleware, passport);

/* cache data */
cacheData = new nodeCache( { checkperiod: 0 } );

Data.findOne({key: "home_page_data"}, function(err, _data) {
    if(err) logger.error(err);
    else if(_data) {
        const temp = _data.value;

        const success = cacheData.set("home_page_data", temp);
        if(success) {
            logger.info("Home page data retrived from Database and cached successfully.");
        } else {
            logger.error("Home page data retrived from Database and but caching failed.")
        }
    } else {
        const placeholder = {
            youtubeURL:"https://www.youtube.com/watch?v=rF9cCAQXGgU",
            students:"300",
            studentsProgress:"40",
            alumni:"100",
            alumniProgress:"70"
        }

        Data.create({ key: "home_page_data", value: placeholder }, function(err) {
            if(err) logger.error(err);
            else {
                const success = cacheData.set("home_page_data", placeholder);
                if(success) {
                    logger.info("Home page data placeholder cached successfully.");
                } else {
                    logger.error("Home page data placeholder caching failed.")
                }
            }
        });
    }
}).lean();

/* using all routes */
app.use(indexRoutes);
app.use(newsRoutes);
app.use(eventRoutes);
app.use(adminRoutes);
app.use(profileRoutes);
app.use(chatRoutes);


app.get('/*', function(req, res){
    res.status(404).send(`
    <div style="text-align:center;">
        <h1>Error 404</h1>
        <h3>Are you lost?!</h3>
        <a href="/">Go Home</a>
    </div>
    `)
});

const port = process.env.PORT

// for dev purposes
// let ip = process.env.PLATFORM == "mobile" ? "0.0.0.0" : process.env.IP

httpServer.listen(port, function(){
    // logger.info("Environment: ",process.env.Node_ENV);
    logger.info("Server is running on port => " + port);
});

/* create test admin */
if(process.env.CREATE_TEST_ADMIN == "true") {
    const adminUsername = "admin", adminPassword = "admin";

    Admin.register(new Admin({ username: adminUsername, createdBy: "1st Admin", active: true }), adminPassword, function (err, user) {
        if (err) {
            if(err.name == "UserExistsError")
                logger.error("Test Admin with that USERNAME is already present!");
            else
                logger.error(err);
        } else
            logger.info(`1st ADMIN created with- USERNAME: ${adminUsername} and PASSWORD: ${adminPassword}`);
    });
}