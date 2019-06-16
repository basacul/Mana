
// =============================================================================================
// SETUP
// =============================================================================================
const express = require('express'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    expressSanitizer = require('express-sanitizer'),
    File = require('./model/file'),
    app = express(),
    port = 3000;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(expressSanitizer()); // this line after app.use(bodyParser.urlencoded({ extended: true }));


// =============================================================================================
// DB STUFF
// =============================================================================================

/* 
 * IMPORTANT: MongoDB needs to be running!!
 * check docs at https://mongoosejs.com/
 */
mongoose.connect("mongodb://localhost:27017/data", { useNewUrlParser: true, useFindAndModify: false });


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


app.post("/login", function (req, res) {
    let user = req.body.user;
    let password = req.body.password;

    // TODO: Implement authentication service
    if (authenticated(user, password)) {
        res.redirect("/home");
    } else {
        res.redirect("/");
    }
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


app.listen(port, () => {
    console.log(`Running at https://localhost:${port}`);
});

// =============================================================================================
// FUNCTIONS
// =============================================================================================
function authenticated(user, password) {
    return user === "user" && password === "pass";
}

function sanitize_text(req) {
    req.body.file.shared = req.body.file.shared ? true : false;

    // sanitize file.fileName and file.note 
    req.body.file.fileName = req.sanitize(req.body.file.fileName);
    req.body.file.note = req.sanitize(req.body.file.note);
}