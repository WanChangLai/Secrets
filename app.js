//jshint esversion:6

// encryption package
require('dotenv').config();

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

//console log the sercet file item API_KEY
console.log(process.env.API_KEY);

app.use(express.static("public"));
//set the view engine to ejs
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true});

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });


const User = mongoose.model('User', userSchema);

app.get("/",function(req,res){
  res.render("home")
});

app.get("/login",function(req,res){
  res.render("login")
});

app.get("/register",function(req,res){
  res.render("register")
});

// after register, render to secrets.ejs
app.post("/register",function(req,res){
  const newUser = new User({
    email:req.body.username,
    password:req.body.password
  });

  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("secrets");
    }
  });
});

//check whether the user is already in our databases
app.post("/login",function(req,res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email:username},function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        if(foundUser.password === password){
          res.render("secrets");
        }
      }
    }
  });
});





app.listen(3000,function(req,res){
  console.log("Server start at port 3000.");
})
