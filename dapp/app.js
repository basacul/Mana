
// =============================================================================================
// SETUP
// =============================================================================================
const express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    passport = require('passport'),
    bodyParser = require('body-parser'),
    LocalStrategy = require('passport-local'),
    passportLocalMongoose = require('passport-local-mongoose'),
    methodOverride = require('method-override'),
    expressSanitizer = require('express-sanitizer'),
    File = require('./models/file'),
    User = require('./models/user'),
    seedDatabase = require('./models/seed'),
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
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(expressSanitizer()); // this line after app.use(bodyParser.urlencoded({ extended: true }));

/**
 * THese two methods are really important : 
 * Deserialize: for reading the session, taking the data from the session and 
 * decoding it
 * Serialize: encodes the data. 
 * This is possible thanks to passport-local-mongoose
 */
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// =============================================================================================
// DB STUFF : MongoDB needs to be running https://mongoosejs.com/
// =============================================================================================

mongoose.connect("mongodb://localhost:27017/mana", { useNewUrlParser: true, useFindAndModify: false });

// resets the database with seed data
seedDatabase();

// =============================================================================================
// ROUTES
// =============================================================================================
app.get("/", function (req, res) {
    let attention = "";
    if (req && req.params.attention) {
        attention = req.params.attention;
    }
    res.render("login");
});



app.get("/home", function (req, res) {
    res.render("home");
});

app.get("/e-record", function (req, res) {
    res.render("e-record");
});

app.get("/tools", function (req, res) {
    res.render("tools");
});

app.get("/documentation", function (req, res) {
    res.render("documentation");
});

app.get("/account", function (req, res) {
    res.render("account");
});

app.get("/messages", function (req, res) {
    res.render("messages");
});

app.get("/contact", function (req, res) {
    res.render("contact");
});

app.get("/faq", function (req, res) {
    res.render("faq");
});

app.get("/checkout", function (req, res) {
    res.render("login");
});


app.get("/private", function (req, res) {
    File.find({}, function (error, files) {
        if (error) {
            console.log(error);
        } else {
            res.render("private", { files: files });
        }
    });

});

// TODO: CREATE SHOULD UPLOAD REAL FILES ***************************************** !!!
// CREATE ROUTE
app.post("/private", function (req, res) {
    sanitize_text(req);
    File.create(req.body.file, function (err, newFile) {
        if (err) {
            console.log(err);
            res.render("/private");
        } else {
            console.log("New File created");
            res.redirect("/private");
        }
    });
});

// EDIT ROUTE SHOULD ALLOW UPLOAD FOR REAL FILES ***************************************** !!!
// SHOW and EDIT ROUTE with button and modal form
app.get("/private/:id", function (req, res) {
    File.findById(req.params.id, function (err, foundFile) {
        if (err) {
            console.log(err);
            res.redirect("/private");
        } else {
            res.render("private_show", { file: foundFile });
        }
    });
});

// UPDATE ROUTE SHOULD ALLOW UPLOAD FOR REAL FILES ***************************************** !!!
// UPDATE ROUTE
app.put("/private/:id", function (req, res) {

    sanitize_text(req);

    File.findByIdAndUpdate(req.params.id, req.body.file, function (err, updatedFile) {
        if (err) {
            console.log("Updating caused an error", err);
            res.redirect("/private");
        } else {
            res.redirect(`/private/${req.params.id}`)
        }
    });
});

// DELETE ROUTE
app.delete("/private/:id", function (req, res) {
    File.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            console.log("ERROR WHEN DELETING FILE ", err);
            res.redirect("/private");
        } else {
            res.redirect("/private");
        }
    });
});

// =============================================================================================
// AUTHENTICATION ROUTES
// =============================================================================================

app.post("/login", passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/'
}), function (req, res) {
    // do nothing
});

/**
 * Handles user sign up
 */
app.post('/register', function (req, res) {
    User.register(new User({ username: req.body.username }), req.body.password, function (err, user) {
        if (err) {
            console.log('Error on sign up', err);
            res.redirect('/');
        } else {
            // we can change the strategy 'local' to 'twitter' or something else
            passport.authenticate('local')(req, res, function () {
                res.redirect('home');
            });
        }
    });
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