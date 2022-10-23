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

const app = express();

//console log the sercet file item API_KEY
console.log(process.env.API_KEY);

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
  password:String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
  res.render("home")
});

app.get("/login",function(req,res){
  res.render("login")
});

app.get("/register",function(req,res){
  res.render("register")
});

//if a ppl is already log in, he shoud be able to view this page
app.get("/secrets",function(req,res){
  if (req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
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
