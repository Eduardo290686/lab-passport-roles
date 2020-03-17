/* Dotenv es un módulo que nos permite cargar variables de entorno
desde un archivo .env a un process.env. */
require('dotenv').config();

/* Body-parser nos permite accerder al cuerpo de la petición. */
/* Esto resulta útil cuando queremos acceder a la información
dentro de una ruta post. */
/* Para ello, necesitaremos habilitar body-parser.json() y 
body-parser.urlencoded(). */
const bodyParser = require('body-parser');
/* Cookie-parser nos permite utilizar cookies. */
const cookieParser = require('cookie-parser');
// Aquí, requerimos el framework Express.
const express = require('express');
// Handlebars (hbs) será nuestro motor de renderizado de plantillas.
const hbs = require('hbs');
/* Esto significa que Mongoose le permite definir objetos con un esquema 
fuertemente tipado que se asigna a un documento MongoDB. */
const mongoose = require('mongoose');
/* El módulo path contiene funcionalidades que nos permitirán trabajar
con rutas a directorios y archivos. */
const path = require('path');
/* El módulo express-session middleware que se utiliza para trabajar
con sesiones. */
const session = require("express-session");
// Bcrypt nos servirá para encriptar información.
// En este caso encriptaremos la contraseña.
const bcrypt = require("bcrypt");
// Passport es un middleware de autenticación.
const passport = require("passport");
/* Módulo de que nos permite utlizar Passport con la estrategia
Local, la cual nos permite hacer log in mediante el método
usuario-contraseña. */
const LocalStrategy = require("passport-local").Strategy;
/* Connect-flash nos permite mostrar mensajes en la pantalla bajo
ciertas condiciones. */
const flash = require("connect-flash");
/* Aquí requerimos el modelo user para, mediante él, conectarnos 
con la base de datos. */
const User = require("./models/user");


mongoose
  .connect('mongodb://localhost/passportRoles', { useNewUrlParser: true })
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });


const app = express();


hbs.registerHelper('ifEqual', function (option1, option2, options) {
  if (option1 === option2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

hbs.registerHelper('ifNotEqual', function (option1, option2, options) {
  if (option1 !== option2) {
    return options.fn(this);
  }
  return options.inverse(this);
});


app.use(session({
  secret: "our-passport-local-strategy-app",
  resave: true,
  saveUninitialized: true
}));

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

passport.use(new LocalStrategy({
  passReqToCallback: true
}, (req, username, password, next) => {
  User.findOne({ username }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, { message: "Incorrect username" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, { message: "Incorrect password" });
    }

    return next(null, user);
  });
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));


const index = require('./routes/index');
app.use('/', index);
const passportRouter = require("./routes/passportRouter");
app.use('/', passportRouter);
const private = require("./routes/private");
app.use('/', private);


module.exports = app;
