
// ==========
// SETUP
// ==========
const express = require('express');
const bodyParser = require('body-parser');
const port = 3000;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// ==========
// DB STUFF
// ==========

// ==========
// ROUTES
// ==========
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

app.get("/dapp", function (req, res) {
    res.render("dapp");
});

app.get("/account", function (req, res) {
    res.render("account");
});

app.get("/messages", function (req, res) {
    res.render("messages");
});

app.get("/personal", function (req, res) {
    res.render("personal");
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

// app.post("/:template", function (req, res) {
//     let template = `/${req.params.template}`;
//     res.redirect(template);
// });

// app.get("/:template", function (req, res) {
//     let template = req.params.template;
//     templat = template === "login" ? "home" : template;
//     let path = `partials/${template}`;

//     res.render("home", {
//         path: path,
//         title: template.toUpperCase()
//     });
// });



app.listen(port, function () {
    console.log(`Running at https://localhost:${port}`);
});

function authenticated(user, password) {
    return user === "user" && password === "pass";
}