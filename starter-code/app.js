/* Dotenv es un módulo que nos permite cargar variables de entorno
desde un archivo .env a un process.env. */
require('dotenv').config();

/* Body-parser nos permite accerder al cuerpo de la petición. */
/* Esto resulta útil cuando queremos acceder a la información
dentro de una ruta post. */
/* Para ello, necesitaremos habilitar body-parser.json() y 
body-parser.urlencoded(). */
const bodyParser = require('body-parser');
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

/* Mongoose.connect nos permite establecer la conexión con nuestra base
de datos. */
mongoose
  .connect('mongodb://localhost/passportRoles', { useNewUrlParser: true })
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });

/* A continuación, guardamos en app la ejecución de la función express().
Esto nos permite ejecutar nuestro servidor en la constante app. */ 
const app = express();

/* Ahora vamos a registrar dos helpers de Handlebars.
Un helper es una función de Javascript que podemos llamar desde las
plantillas. En este caso, vamos a registrar uno llamado ifEqual, que
nos permitirá hacer comparaciones de igualdad con los argumentos que
le pasemos, y otro con el nombre inNotEqual, el cual hará comparaciones
de desigualdad. */
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

// Configuración de express-session.
app.use(session({
  secret: "our-passport-local-strategy-app",
  resave: true,
  saveUninitialized: true
}));

/* Passport.serializeUser nos permite utilizar cookies para guardar
información acerca de la sesión. */
/* Una cookie (galleta o galleta informática) es una pequeña 
información enviada por un sitio web y almacenada en el navegador 
del usuario, de manera que el sitio web puede consultar la actividad 
previa del navegador. */
// La información queda almacenada en req.session.passport.user.
passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

/* Passport.deserializeUser permite recuperar la información
almacenada en la cookie. */
passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

/* Configuramos la estrategia de Passport que vamos a utilizar.
En este caso, se trata de LocalStrategy la cual, nos permite
trabajar con una autenticación del tipo usuario-contraseña. */
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

// Habilitamos la utilización de los middelware que vamos a emplear.
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));

// Definimos las rutas que vamos a emplear.
const index = require('./routes/index');
app.use('/', index);
const passportRouter = require("./routes/passportRouter");
app.use('/', passportRouter);
const private = require("./routes/private");
app.use('/', private);

// Exportación del archivo.
module.exports = app;
