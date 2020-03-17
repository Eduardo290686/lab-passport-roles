const express = require('express');
const router = express.Router();
const ensureLogin = require("connect-ensure-login");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const passport = require("passport");
const roles = require("../modules/roles");


const bcryptSalt = 10;

const checkBoss = roles(["BOSS"]);
const checkDeveloper = roles(["DEVELOPER"]);
const checkTA = roles(["TA"]);

/****************All users routes************/

router.get("/list", ensureLogin.ensureLoggedIn("/login"),
  (req, res, next) => {
    User
      .find().
      then(users => {
        let user = req.user;
        res.render("list", {
          users, user
        })
      })
  });

router.get("/logout", ensureLogin.ensureLoggedIn("/login"),
  (req, res, next) => {
    req.logout();
    res.redirect("/login");
  });

router.get("/userDetail/:id", ensureLogin.ensureLoggedIn("/login"),
  (req, res, next) => {
    let id = req.params.id;
    User.findById(id).
      then((userInfo) => {
        currentUser = req.user;
        res.render("userDetail", { userInfo, currentUser });
      })
  })

router.get("/updatePassword", ensureLogin.ensureLoggedIn("/login"),
  (req, res, next) => {
    let id = (req.user._id);
    User.findById(id)
      .then((user) => {
        res.render("updatePassword", { "message": req.flash("error"), user });
      })
  })

router.post("/updatePassword", ensureLogin.ensureLoggedIn("/login"),
  passport.authenticate("local", {
    successRedirect: "/newPassword",
    failureRedirect: "/updatePassword",
    failureFlash: true,
    passReqToCallback: true,
    session: false
  }));

router.get("/newPassword", ensureLogin.ensureLoggedIn("/login"),
  (req, res, next) => {
    console.log(req.user);
    res.render("newPassword");
  })

router.post("/newPassword", ensureLogin.ensureLoggedIn("login"),
  (req, res, next) => {
    let password = req.body.password;

    if (password === "") {
      res.render("newPassword", { message: "No password introduced" });
      return;
    }

    let name = req.user.username;

    const salt = bcrypt.genSaltSync(bcryptSalt);

    const hashPass = bcrypt.hashSync(password, salt);

    User.updateOne({ username: name }, { password: hashPass })
      .then(console.log('updated'));
    res.redirect("/list");
  })

/**************Specific boss routes*******************/

router.get("/create", checkBoss, (req, res) => {
  res.render("create");
})

router.post("/create", checkBoss, (req, res) => {
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

router.get("/deleteUser/:id", checkBoss, (req, res, next) => {
  let id = req.params.id;
  User.findByIdAndDelete(id)
    .then(user => {
      res.redirect("/list")
    })
});


module.exports = router;
