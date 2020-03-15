const express = require('express');
const router = express.Router();
const ensureLogin = require("connect-ensure-login");
const User = require("../models/user");

router.get("/list", ensureLogin.ensureLoggedIn("/login"), (req, res) => {
  User
    .find().
    then(users => {
      res.render("list", {
        users, user: req.user
      })
    })
});

router.get("/logout", ensureLogin.ensureLoggedIn("/login"), (req, res) => {
  req.logout();
  res.redirect("/login");
});

router.get("/userDetail/:id", ensureLogin.ensureLoggedIn("/login"), (req, res, next) => {
  id = req.params.id;
  User.findById(id).
  then((userInfo) => {
    console.log(userInfo);
    res.render("userDetail", { userInfo });
  })
})

module.exports = router;
