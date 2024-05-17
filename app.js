const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const methodOverride = require('method-override');
const dotenv = require("dotenv").config();

const app = express();

// Middleware
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Routes
app.use("/", require("./routes/pages"));
app.use("/auth", require("./routes/auth"));
const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);


// Starting the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
