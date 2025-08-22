var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var mongoose = require("mongoose");
const i18n = require("i18n");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var adminRouter = require("./routes/admin");

var app = express();

i18n.configure({
  locales: ["en", "mm"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "mm",
  queryParameter: "lang",
  autoReload: true,
  syncFiles: false,
  objectNotation: true,
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect("mongodb://127.0.0.1/heapsdb-v2");
// mongoose.connect(
//   "mongodb+srv://heaps:heaps2025@heaps.fbkebaa.mongodb.net/?retryWrites=true&w=majority&appName=heaps"
// );
const db = mongoose.connection;
db.on("error", console.error.bind("mongodb connection error at heapsdb"));

app.use(
  session({
    secret: "PyayCU@HEAPS2025",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(i18n.init);

app.use(function (req, res, next) {
  if (req.query.lang) {
    req.setLocale(req.query.lang);
    req.session.locale = req.query.lang;
  } else if (req.session.locale) {
    req.setLocale(req.session.locale);
  }
  res.locals.lang = req.getLocale();
  res.locals.user = req.session.user;
  res.locals.admin = req.session.admin;
  next();
});

app.use("/", indexRouter);
app.use("/user", usersRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
