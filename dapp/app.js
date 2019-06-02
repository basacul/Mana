
// =============================================================================================
// SETUP
// =============================================================================================
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const port = 3000;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");



// =============================================================================================
// DB STUFF
// =============================================================================================

/* 
 * IMPORTANT: MongoDB needs to be running!!
 * check docs at https://mongoosejs.com/
 */
mongoose.connect("mongodb://localhost:27017/data", { useNewUrlParser: true });

const fileSchema = new mongoose.Schema({
    fileName: String,
    file: String,
    note: String,
    shared: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});

const File = mongoose.model("File", fileSchema);

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


app.get("/private", function (req, res) {
    File.find({}, function (error, files) {
        if (error) {
            console.log(error);
        } else {
            res.render("private", { files: files });
        }
    });

});

app.post("/private", function (req, res) {
    //create new file
    // throws errors
    req.body.file.shared = req.body.file.shared ? true : false;
    console.log(req.body.file);
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
app.get("/contact", function (req, res) {
    res.render("contact");
});

app.get("/faq", function (req, res) {
    res.render("faq");
});

app.get("/checkout", function (req, res) {
    res.render("login");
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