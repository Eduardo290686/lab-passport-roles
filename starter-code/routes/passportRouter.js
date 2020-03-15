const express = require("express");
const router = express.Router();
const passport = require("passport");
const roles = require("../modules/roles")

const User = require("../models/user");

const bcrypt = require("bcrypt");
const bcryptSalt = 10;

const checkBoss = roles(["BOSS"]);
const checkDeveloper = roles(["DEVELOPER"]);
const checkTA = roles(["TA"]);

router.get("/login", (req, res, next) => {
  res.render("login", { "message": req.flash("error") });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/list",
  failureRedirect: "/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/create", checkBoss, (req, res) => {
  res.render("create");
})

router.post("/create", /* checkBoss, */ (req, res) => {
  // We can create the first boss user profile using passport.
  // Previously, we will need to comment the checkBoss parameter.
  const pass = req.body.password;
  if (req.body.username.length > 0 && pass.length > 0) {
    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hash = bcrypt.hashSync(pass, salt);
    User.find({
        username: req.body.username
      })
      .then((users) => {
        console.log(users);
        if (users.length === 0) {
          User.create({
              username: req.body.username,
              password: hash,
              role: req.body.role
            })
            .then(newUser => {
              res.redirect("/list");
            })
        } else {
          res.render("create", {
            message: "The username already exists",
          });
        }
      })
  } else {
    res.render("create", {
      message: "You must fill both user name and password fields!"
    });
  }
});


module.exports = router;
