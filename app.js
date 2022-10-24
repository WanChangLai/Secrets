//jshint esversion:6

// encryption package
require('dotenv').config();

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose =require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.use(express.static("public"));
//set the view engine to ejs
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
  secret:"Our little secret.",
  resave: false,
  saveUninitialized: false,
  //cookie:{secure:true}
}));

//initialise the passport for authetication
app.use(passport.initialize());
//initialise for the session inside the passport
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true});

const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
  done(null,user.id);
});

passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    done(err, user);
  });
});

//using google strategy passing in clientid and client secret
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home")
});

// to settle the href in the authenticate using google
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

//after we login with the google, render to this route
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
  res.render("login")
});

app.get("/register",function(req,res){
  res.render("register")
});

//find all the users with secret in the collection
app.get("/secrets",function(req,res){
  User.find({"secret":{$ne:null}},function(err,foundUsers){
    if(err){
      console.log(err);
    }else{
      if (foundUsers){
        res.render("secrets",{usersWithSecrets:foundUsers})
      }
    }
  });
});

app.get("/submit",function(req,res){
  //to check whether the authentication is done
  if (req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const submittedSecret = req.body.secret

  //console.log(req.user.id);

  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});



app.get("/logout",function(req,res){
  req.logout(function(err){
    if(!err){
      res.redirect("/")
    }else{
      console.log(err);
    }
  });
});


// after register, render to secrets.ejs
app.post("/register",function(req,res){

  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      //send a cookie to teh browser that this ppl ady log in
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

//check whether the user is already in our databases
app.post("/login",function(req,res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});





app.listen(3000,function(req,res){
  console.log("Server start at port 3000.");
})
