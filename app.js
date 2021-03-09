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
      flash = require('connect-flash');

      ////////////////////////
      const httpServer = require("http").createServer(app);
      const io = require("socket.io")(httpServer);
      
const e = require("express");
const allMiddlewares = require("./middleware");
      ///////////////////////

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


app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set("view engine", "ejs");      // required to use ejs
app.use(express.static(__dirname + "/public"));     // public directory to serve
app.use(methodOverride("_method"));
app.use(flash());


/* passport configuration */
const MongoStore = connectMongo(expressSession);    // for session storage
////////////////////////////////////
const sessionMiddleware = expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 3600000 * 24 * 7,
    }, //7days // set "secure:true" only when using https
    store: new MongoStore({ mongooseConnection: mongoose.connection }) // may be more configuration in future
})
app.use(sessionMiddleware);
////////////////////////////////////

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
    }, 'firstName lastName username userType',  function (err, user) {
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
    user = { _id: user._id, username :user.username, firstName: user.firstName, fullName: user.firstName + " " + user.lastName, role: user.role };
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

/////////////////////////
// convert a connect middleware to a Socket.IO middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

io.use((socket, next) => {
  if (socket.request.user) {
    socket.userid = socket.request.user._id;
    next();
  } else {
    next(new Error('unauthorized'))
  }
});

io.on('connection', (socket) => {
    /* send chats */
    User.findById( socket.request.user._id, 'chats', function(err, userData){
        if(err){
            console.log(err);
        } else {
            socket.username = socket.request.user.fullName;
            socket.emit("my chats", userData.chats);
            // console.log(JSON.stringify(userData.chats, null, 2));
        }
    });

    /* join room */
    socket.join(socket.request.user._id);

    /* seperate msg */
    socket.on("private message", ({ content, to }) => {
        const sender = socket.request.user._id;
        
        User.findByIdAndUpdate( sender, {
            "$push": {
                "chats.$[a].messages": {
                    who: 0,
                    msg: content
                }
            }
        },
        {
            arrayFilters: [
                {"a.userid": to}
            ]
        },
        function(err){
            if (err)
                console.log(err)
            else {
                User.findByIdAndUpdate( to, {
                    "$push": {
                        "chats.$[a].messages": {
                            who: 1,
                            msg: content
                        }
                    }
                },
                {
                    arrayFilters: [
                        {"a.userid": sender}
                    ]
                },
                function(err){
                    if (err)
                        console.log(err)
                    else {
                        // send to receiver
                        socket.to(to).emit("private message", {
                            content,
                            from: {
                            userid: sender,
                            username: socket.username
                            }
                        });
                    }
                });
            }
        });

    });

});
/////////////////////////


/* using all routes */
app.use(indexRoutes);
app.use(newsRoutes);
app.use(eventRoutes);
app.use(adminRoutes);
app.use(profileRoutes);
//////////////////////////////////

app.get('/chats', allMiddlewares.rejectAdmin, function(req, res) {
    res.render('chats');
});

app.get('/chats/:id', allMiddlewares.rejectAdmin, function(req, res) {
    const currentUser = req.user._id;
    const currentUserName = req.user.fullName;
    const receiver = req.params.id;

    /* new chat */
    if (currentUser != receiver && req.user.role != "admin") {
        User.findById( receiver, 'firstName lastName', function(err, receiverData) {
            if(err) {
                console.log(err);
                res.redirect('/communicate');
            } else {
                const receiverFullName = receiverData.firstName + " " + receiverData.lastName;
                

                User.findOneAndUpdate( {
                    _id: currentUser,
                    'chats.userid': { $ne: receiver}
                }, 
                {
                    "$push": {
                        "chats": {
                                userid: receiver,
                                username: receiverFullName,
                                messages: []
                            }
                    }
                },
                function(err, changes){
                    if (err) {
                        console.log(err);
                        res.redirect('/communicate');
                    }
                    else if (changes != null){
                        User.findByIdAndUpdate( receiver, {
                            "$push": {
                                "chats": {
                                        userid: currentUser,
                                        username: currentUserName,
                                        messages: []
                                    }
                            }
                        },
                        function(err){
                            if (err)
                                console.log(err);
                            else {
                                res.redirect('/chats');
                            }
                        });
                    } else {
                        res.redirect('/chats');
                    }
                });

            }
        });
    } else {
        res.redirect('/communicate');
    }
});

//////////////////////////////////

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

httpServer.listen(port, ip, function(){
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