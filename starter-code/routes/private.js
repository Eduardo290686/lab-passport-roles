const express = require('express');
const router = express.Router();
const ensureLogin = require("connect-ensure-login");
const User = require("../models/user");
const Course = require("../models/course");
const bcrypt = require("bcrypt");
const passport = require("passport");
const roles = require("../modules/roles");


const bcryptSalt = 10;

const checkBoss = roles(["BOSS"]);
const checkDeveloper = roles(["DEVELOPER"]);
const checkTA = roles(["TA"]);
const checkAlumni = roles(["ALUMNI"]);

/*********** Rutas comunes a todos los usuarios. ************/

router.get("/home", ensureLogin.ensureLoggedIn("/login"),
  (req, res, next) => {
    res.render("home");
  })

router.get("/users", ensureLogin.ensureLoggedIn("/login"),
  (req, res, next) => {
    User
      .find().
      then(users => {
        let user = req.user;
        res.render("users", {
          users, user
        })
      })
  });

router.get("/courses", ensureLogin.ensureLoggedIn("/login"),
  (req, res, next) => {
    let user = req.user;
    Course
      .find()
      .then((courses) => {
        res.render("courses", { user, courses })
      })
  })

router.get("/courseDetail/:id", ensureLogin.ensureLoggedIn("/login"),
  (req, res, next) => {
    let user = req.user;
    let courseId = req.params.id;
    Course.findById(courseId)
      .then((course) => {
        res.render("courseDetail", { course, user });
      })
  })

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
      .then((newUser) => {
        res.redirect("/users");
      });
  })

/************** Rutas específicas del jefe. *******************/

router.get("/createUser", checkBoss, (req, res) => {
  res.render("createUser");
})

router.post("/createUser", checkBoss, (req, res) => {
  const pass = req.body.password;
  if (req.body.username.length > 0 && pass.length > 0) {
    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hash = bcrypt.hashSync(pass, salt);
    User.find({
      username: req.body.username
    })
      .then((users) => {
        if (users.length === 0) {
          User.create({
            username: req.body.username,
            password: hash,
            role: req.body.role
          })
            .then(newUser => {
              res.redirect("/users");
            })
        } else {
          res.render("createUser", {
            message: "The username already exists",
          });
        }
      })
  } else {
    res.render("createUser", {
      message: "You must fill both user name and password fields!"
    });
  }
});

router.get("/deleteUser/:id", checkBoss, (req, res, next) => {
  let id = req.params.id;
  User.findByIdAndDelete(id)
    .then(user => {
      res.redirect("/users")
    })
});

/********************** Rutas de los TA's. *************************/

router.get("/createCourse", checkTA, (req, res, next) => {
  res.render("createCourse");
})

router.post("/createCourse", checkTA, (req, res, next) => {
  let name = req.body.courseName;
  let description = req.body.description;
  Course.find({ courseName: name })
    .then((courses) => {
      if (courses.length === 0) {
        if (name.length === 0) {
          res.render("createCourse",
            { message: "Introduce a name for the course" });
        } else if (description.length === 0) {
          res.render("createCourse",
            { message: "Introduce a description for the course" });
        } else {
          Course.create({
            courseName: name,
            courseDescription: description
          })
          Course.find()
            .then((courses) => {
              res.redirect("/courses")
            })
        }
      }
      else {
        res.render("createCourse", { message: "This course already exists" });
      }
    })
})

router.get("/updateCourse/:id", checkTA, (req, res, next) => {
  let id = req.params.id;
  Course.findById(id)
    .then((course) => {
      console.log(course);
      res.render("updateCourse", { course });
    })
})

router.post("/updateCourse/:id", checkTA, (req, res, next) => {
  let user = req.user;
  let id = req.params.id;
  let name = req.body.name;
  let description = req.body.description;
  if (name.length === 0 || description.length === 0) {
    Course.findById(id)
      .then((course) => {
        res.render("updateCourse", { course, message: "You have to add name and description"});
      })
  }
  Course.updateOne({ _id: id }, { courseName: name, courseDescription: description })
    .then((course) => { });
  Course.findById(id)
    .then((course) => {
      res.render("courseDetail", { course, user });
    })
})

router.get("/deleteCourse/:id", checkTA, (req, res, next) => {
  let id = req.params.id;
  Course.findByIdAndDelete(id)
    .then((course) => {
      res.redirect("/courses");
    })
})

// Exportación del documento.
module.exports = router;
