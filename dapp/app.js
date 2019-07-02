
// =============================================================================================
// SETUP
// =============================================================================================
const express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    passport = require('passport'),
    bodyParser = require('body-parser'),
    LocalStrategy = require('passport-local'),
    methodOverride = require('method-override'),
    expressSanitizer = require('express-sanitizer'),
    User = require('./models/user'),
    // seedDatabase = require('./models/seed'), // commented otherwise it still seeds the db
    port = 3000;

app.set("view engine", "ejs");

app.use(require('express-session')({
    secret: 'Mana is a dapp',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/public`));
app.use(methodOverride("_method"));
app.use(expressSanitizer()); // this line after app.use(bodyParser.urlencoded({ extended: true }));

/**
 * THese two methods are really important : 
 * Deserialize: for reading the session, taking the data from the session and 
 * decoding it
 * Serialize: encodes the data. 
 * This is possible thanks to passport-local-mongoose. Do not forget the parenthesis
 * at the end of the method authenticate, serializeUser and deserializeUser. Otherwise
 * you won't see any errors nor does the application work as intended, thus causing
 * a lot of headaches.
 */
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware that allows to inject currentUser to each site, especially
// in the header and footer
app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
});



// =============================================================================================
// DB STUFF : MongoDB needs to be running https://mongoosejs.com/
// =============================================================================================

mongoose.connect("mongodb://localhost:27017/mana", { useNewUrlParser: true, useFindAndModify: false });

// seedDatabase(); // resets the database with seed data

// =============================================================================================
// ROUTES
// =============================================================================================
const authRoutes = require('./routes/auth'),
    privateRoutes = require('./routes/private'),
    homeRoutes = require('./routes/home'),
    eRecordRoutes = require('./routes/e-record'),
    toolsRoutes = require('./routes/tools'),
    documentationRoutes = require('./routes/documentation'),
    accountRoutes = require('./routes/account'),
    messageRoutes = require('./routes/messages'),
    contactRoutes = require('./routes/contact'),
    faqRoutes = require('./routes/faq');

app.use('/', authRoutes);
app.use('/private', privateRoutes);
app.use('/home', homeRoutes);
app.use('/e-record', eRecordRoutes);
app.use('/tools', toolsRoutes);
app.use('/documentation', documentationRoutes);
app.use('/account', accountRoutes);
app.use('/messages', messageRoutes);
app.use('/contact', contactRoutes);
app.use('/faq', faqRoutes);

// DEFAULT ROUTE IF NOTHING ELSE MATCHES
app.get('*', function (req, res) {
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Running at https://localhost:${port}`);
});

// =============================================================================================
// FUNCTIONS
// =============================================================================================
function sanitize_text(req) {
    req.body.file.shared = req.body.file.shared ? true : false;

    // sanitize file.fileName and file.note 
    req.body.file.fileName = req.sanitize(req.body.file.fileName);
    req.body.file.note = req.sanitize(req.body.file.note);
}

/**
 * Our middleware for authoritisation and authentication
 */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/');
    }
}