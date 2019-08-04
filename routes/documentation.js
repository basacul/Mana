const express = require('express');
const router = express.Router(); // now instead of app, use router
const middleware = require('../middleware');

router.get("/", middleware.isLoggedIn, function (req, res) {
    res.render("app/documentation");
});

module.exports = router;