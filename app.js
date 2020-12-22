require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');


//for cookies and session
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//seting up a session
//positioning of the code is important
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

//seting up passport
//use documentation to configure passports
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
//for warnings
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

//used for hash and salt our passwords and save in mongoDB
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());
//to convert data into cookie
passport.serializeUser(User.serializeUser());
//to convert cookie to content inside it
passport.deserializeUser(User.deserializeUser());

app.get('/', function(req, res){
  res.render('home')
})

// login route
app.get('/login', function(req, res){
  res.render('login')
})

app.post('/login', function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate('local')(req, res, function(){
        res.redirect('/secrets');
      });
    }
  })
});

// register route
app.get('/register', function(req, res){
  res.render('register')
})

app.post('/register', function(req, res){

  //this is how to register users using passport
  User.register({username: req.body.username}, req.body.password, function(err, user){

    if(err){
      console.log(err);
      res.redirect('/register');
    }
    else{
      passport.authenticate('local')(req, res, function(){
        res.redirect('/secrets');
      });
    }
  });
});

app.get('/secrets', function(req, res){
  //here if the user is authenticated we will render him
  //the secrets page but if not then we will redirect him
  //to login page
  if(req.isAuthenticated()){
    res.render('secrets');
  } else{
    res.redirect('/login');
  }

});

// logout route
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
})
app.listen(3000, function(){
  console.log('Server started at Port 3000:');
})
