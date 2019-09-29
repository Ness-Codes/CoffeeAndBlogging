var bodyParser        = require("body-parser"),
methodOverride        = require("method-override"),
expressSanitizer      = require("express-sanitizer"),
mongoose              = require("mongoose"),
express               = require("express"),
app                   = express(),
passport              = require("passport"),
LocalStrategy         = require("passport-local"),
passportLocalMongoose = require("passport-local-mongoose"),
User                  = require('./models/user');

// APP CONFIG
mongoose.connect("mongodb://localhost/restful_blog_app", {useNewUrlParser: true});
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

//Passport Config
app.use(require("express-session")({
  secret: "Secret Passage.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  next();
});

// MONGOOSE/MODEL CONFIG
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {type: Date, default: Date.now}
});
var Blog = mongoose.model("Blog", blogSchema);

// RESTFUL ROUTES

app.get("/", function(req, res){
   res.render("home");
});


// INDEX ROUTE (When user is logged in)
app.get("/index", isLoggedIn, function(req, res){
  res.redirect("index");
});

app.get("/blogs", function(req, res){
   Blog.find({}, function(err, blogs){
       if(err){
           console.log("ERROR!");
       } else {
          res.render("index", {blogs: blogs});
       }
   });
});

// NEW ROUTE
app.get("/blog/new", function(req, res){
    res.render("new");
});

// CREATE ROUTE
app.post("/blogs", function(req, res){
    // create blog
    Blog.create(req.body.blog, function(err, newBlog){
        if(err){
            res.render("new");
        } else {
            //then, redirect to the index
            res.redirect("/blogs");
        }
    });
});

// SHOW ROUTE
app.get("/blogs/:id", function(req, res){
   Blog.findById(req.params.id, function(err, foundBlog){
       if(err){
           res.redirect("/blogs");
       } else {
           res.render("show", {blog: foundBlog});
       }
   })
});

// EDIT ROUTE
app.get("/blogs/:id/edit", function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
        } else {
            res.render("edit", {blog: foundBlog});
        }
    });
})


// UPDATE ROUTE
app.put("/blogs/:id", function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body)
   Blog.findByIdAndUpdate(req.params.id, req.body.blog, {new: true}, function(err, updatedBlog){
      if(err){
          res.redirect("/blogs");
          console.log(err);
      }  else {
          res.redirect("/blogs/" + req.params.id);
      }
   });
});

// DELETE ROUTE
app.delete("/blogs/:id", function(req, res){
   //destroy blog
   Blog.findByIdAndRemove(req.params.id, function(err){
       if(err){
           res.redirect("/blogs");
       } else {
           res.redirect("/blogs");
       }
   });
});


//AUTHENTICATION

//SIGNUP ROUTE
app.get("/signup", function(req, res){
  res.render("signup");
});

//SIGNUP POST REQUEST
app.post("/signup", function(req, res){
  User.register(new User({ username: req.body.username}), req.body.password, function(err, user){
    if(err){
      console.log(err);
      return res.render("signup");
    }
    passport.authenticate("local")(req, res, function(){
      res.render("index");
    });
  });
});

//LOGIN ROUTE
app.get("/login", function(req,res){
  res.render("login");
});

//=======================================================//
//         Must be logged in to access blogs             //
//=======================================================//

app.post("/login", passport.authenticate("local",
  {
    successRedirect: "/blogs",
    failureRedirect: "/login"
  }),
  function(req, res){});


//LOGOUT ROUTE
app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});
// ========== Middleware =========== //
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}

app.listen(4000, function(){
    console.log("SERVER IS RUNNING!");
});
