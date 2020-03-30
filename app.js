//jshint esversion:6
const ejs=require("ejs");
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const salt=10;

const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded(
  {
    extended:true
  }
));

mongoose.connect("mongodb://localhost:27017/userdb",{useNewUrlParser:true,useUnifiedTopology:true});
const userSchema= new mongoose.Schema({
  email:String,
  password:String
});
const User=new mongoose.model("user",userSchema);

app.post("/register",function(req,res){
  bcrypt.hash(req.body.password,salt,function(err,hash){
  const newUser= new User({
    email:req.body.username,
    password:hash
  });

  newUser.save(function(err){
    if(err){
      console.log(err);
    }
    else{
      res.render("secrets");
    }
  });
});
});
app.post("/login",function(req,res){
  User.findOne({email:req.body.username},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
      bcrypt.compare(password,foundUser.password,function(err,result){
        if(result===true){
          res.render("secrets");
        }
      });
    }
  }
  });
});

app.get("/",function(req,res){
  res.render("home");
});
app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});
app.get("/logout",function(req,res){
  res.redirect("/");
});
app.listen(3000,function(){
  console.log("sever live on port 3000");
});
