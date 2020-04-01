//jshint esversion:6
require("dotenv").config();
const ejs=require("ejs");
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const passport=require("passport");
const GoogleStrategy=require("passport-google-oauth20").Strategy;
const app=express();
const passportLocalMongoose=require("passport-local-mongoose");
const session=require("express-session");
const findOrCreate=require("mongoose-findorCreate");
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded(
  {
    extended:true
  }
));
app.use(session({
  secret:"ourSECRETlongstringvariablekeYgvbnbhgvfcxdfrtghkdghftdgtgf",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/userdb",{useNewUrlParser:true,useUnifiedTopology:true});
mongoose.set('useCreateIndex', true);
const userSchema= new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  secret:String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User=new mongoose.model("user",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET ,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
app.get("/secrets",function(req,res){
    User.find({"secret":{$exists:true}},function(err,results){
      if(!err){
        res.render("secrets",{foundUsers:results});
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
  req.logout();
  res.redirect("/");
});
app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
}
else{
  res.redirect("/login");
}
});

app.post("/register",function(req,res){

    User.register({username:req.body.username},req.body.password,function(err,user){
      if(!err){
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
        });
      }
    });
});

app.post("/login",function(req,res){

    const user=new User({
      username:req.body.username,
      password:req.body.password
    });
    req.login(user,function(err){
      if(!err){
          passport.authenticate("local")(req,res,function(){
              res.redirect("/secrets");
          });
      }
    });
});

app.post("/submit",function(req,res){
  const submittedUser=req.body.secret;
  User.findById(req.user.id,function(err,foundUser){
    if(!err){
      foundUser.secret=submittedUser;
      foundUser.save(function(err){
        if(!err){
        res.redirect("/secrets");
      }
      });
    }
  });
});
app.listen(3000,function(){
  console.log("sever live on port 3000");
});
