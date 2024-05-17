const express = require("express");
const authController = require("../controllers/auth");
const router = express.Router();

// Home page
router.get('/', (req, res) => {
    res.render("home.ejs", { root: './views/' });
});

// Registration page
router.get('/register', (req, res) => {
    res.render("register.ejs", { root: './views/' });
});

// Login page
router.get('/login', (req, res) => {
    res.render("login.ejs", { root: './views/' });
});

// About page
router.get('/about', (req, res) => {
    res.render("about.ejs", { root: './views/' });
});

// Policy page
router.get('/policy', (req, res) => {
    res.render("policy.ejs", { root: './views/' });
});

// FAQ page
router.get('/faq', (req, res) => {
    res.render("faq.ejs", { root: './views/' });
});

// OTP page
router.get('/otp', (req, res) => {
    res.render("otp.ejs", { root: './views/' });
});

// Voter login page
router.get('/voter-login/:token/:id', (req, res) => {
    res.render("voter-login.ejs", { root: './views/' });
});
router.get('/admin-login', (req, res) => {
    res.render("admin-login.ejs", { root: './views/' });
});
router.get('/voter/:token/:id', (req, res) => {
    res.render("voter.ejs", { root: './views/' });
});
// Conductor page
router.get('/conductor', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render("conductor.ejs", { root: './views/' });
    } else {
        res.render("login.ejs", { root: './views/' });
    }
});

// Conduct election page
router.get('/conductor/election', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render("conductor.ejs", { root: './views/' });
    } else {
        res.render("login.ejs", { root: './views/' });
    }
});

// Update details page
router.get('/conductor/update-details', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render("update-details.ejs", { root: './views/' });
    } else {
        res.render("login.ejs", { root: './views/' });
    }
});

module.exports = router;
