// //server/routes/routes.js
// var express = require('express');
// var router = express.Router();
// var bodyParser = require('body-parser');


/**SADRENOTES**********************************************/
/* Simple node authentication and session using 
/* MongoDB/NOSQL.
/* Uses a simple scheme to store both user accounts and
/* session data
/*
/**********************************************************/

//server/routes/routes.js
var express = require('express');
var router = express.Router();
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var port = process.env.PORT || 8080; //listening port for testing, remove in real case
var session = require('express-session'); //session data
var mongoose = require('mongoose'); //setup for MongoDB useage
var MongoDBStore = require('connect-mongodb-session')(session); //session data
var URI = 'mongodb://sharonse:abc123@ds249942.mlab.com:49942/expenses'; //mlab info for collections
var passport = require('passport'); //used for session and authentication
var LocalStrategy = require('passport-local').Strategy; //used for session and authentication
var Expense = require('../../models/Expense');


/**********************************************************/
/* setup main app/express usage for req.body via body 
/* parser.
/* Also setup for html view via ejs
/*
/**********************************************************/
// configuring app, views, view engine, parser
// app.use(bodyParser.urlencoded({
//   extended: true
// }));
// app.use(bodyParser.json());
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
app.use('/', router);
/**********************************************************/
/* END END END
/**********************************************************/

/**********************************************************/
/* setup and connect to database for session storage
/*
/**********************************************************/
//setup collective for session storing
var store = new MongoDBStore({
  uri: 'mongodb://sharonse:abc123@ds249942.mlab.com:49942/expenses',
  collection: 'mySessions'
});

// Connect to database
store.on('connected', function () {
  store.client; // The underlying MongoClient object from the MongoDB driver
});

// Catch errors
store.on('error', function (error) {
  assert.ifError(error);
  assert.ok(false);
});

//database connection, probably rejected because of previous connection
mongoose.connect(URI, function (err) {
  if (err) throw err;
  console.log('Successfully connected');
});

// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


// configure session data in terms of time
router.use(session({
  secret: 'abbazabba',
  cookie: {
    maxAge: 1000 * 60 * 5 // 5 minutes
  },
  store: store,
  resave: false,
  saveUninitialized: false
}));
/**********************************************************/
/* END END END
/**********************************************************/


/**********************************************************/
/* passport, authentication setup/passthru service
/*
/**********************************************************/
//Using LocalStrategy for authentication and logging in
// /login is basically passed through here to verify username and passsword
passport.use(new LocalStrategy(function (username, pword, done) {
  //Take username and password and find a matching user
  // in the database.
  User.findOne({
      $and: [
        {
          userName: username
        },
        {
          password: pword
        }
      ]
    },
    '_id name userName password',
    function (err, user) {
      if (err) return handleError(err)
      return done(null, user._id);
    }
  );
}));

//Use passport to store session and keep user logged in
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});

//Initialize Passport and authentication
router.use(passport.initialize());
router.use(passport.session());
router.use(function (req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});
/**********************************************************/
/* END END END
/**********************************************************/


/**********************************************************/
/* file: user.js
/* User: input and stored into database
/* Database name: Users
/* Schema: 
/*    _id (Integer, primary key, auto increment, not null), 
/*    Name.FirstName (string, trim, not null)
/*    Name.LastName (string, trim, not null)
/*    Username (string, trim, not null, unique)
/*    password (string, trim, not null)
/*    date created (date, auto-generated-now)
/* Input: FirstName, Lastname, Username, password
/**********************************************************/
let User = require('./user');


/**********************************************************/
/* Gets.Post.Updates.Deletes
/**********************************************************/
router.get('/', function (req, res, next) {
  if (req.isAuthenticated()) {
    console.log('user is authenticated');
  } else {
    console.log('user is not authenticated');
  }
  User.find({}, function (err, person) {
    if (err) return handleError(err);
    res.render('index');
  });
});

router.get('/index', function (req, res, next) {
  if (req.isAuthenticated()) {
    console.log('user is authenticated');
  } else {
    console.log('user is not authenticated');
  }
  User.find({}, function (err, person) {
    if (err) return handleError(err);
    res.render('index');
  });
});

/**********************************************************/
/*  Page added to create new end users and add to DB
/*  On successful: redirects to index '/' page and
/*  also logs that user in and creates a session for them.
/*  
/*  On failure: redirects to index '/failed' page
/*  index and failed pages may not exist and may need to
/*  be created
/**********************************************************/
//Get Newuser page
router.get('/newuser', function (req, res, next) {
  res.render('newuser', {
    title: 'Create User'
  });
});

//Post Newuser page
//Creates a new user, takes in 4 inputs.
//Username must be unique, all fields need to be 
//at least 3 characters long.
router.post('/newuser', (req, res) => {
  let fName = '';
  let lName = '';
  let uName = '';
  let pword = '';

  fName = req.body.firstName;
  lName = req.body.lastName;
  uName = req.body.username;
  pword = req.body.password;

  // only checking each field as at least 3 characters, no other criteria checked
  if (fName.length > 2 && lName.length > 2 && uName.length > 2 && pword.length > 2) {
    var userData = new User({
      _id: new mongoose.Types.ObjectId(),
      name: {
        firstName: fName,
        lastName: lName,
      },
      userName: uName,
      password: pword
    });

    //creates user, redirects to index if successful
    // otherwise redirects to /failed
    userData.save(function (err) {
      if (err) {
        console.log(err);
        console.log('User creation failed.');
        res.redirect('/failed');
      } else {
        console.log('User successfully saved.');
        //logs user in after creation and redirects to main page
        req.login(userData._id, function (err) {
          res.redirect('/');
        });
      }
    });
  }
});

/**********************************************************/
/*  Page added to allow users to login to DB
/*  On successful: redirects to index '/' page and
/*  also logs that user in and creates a session for them.
/*  
/*  On failure: redirects to index '/failed' page
/*  index and failed pages may not exist and may need to
/*  be created
/**********************************************************/
//Get login page
//Allow user to login, looks through database to see if user exist
router.get('/login', function (req, res, next) {
  res.render('login', {
    title: 'login'
  });
});

//Post login page
//Allow user to login, looks through database to see if user exist.
//If user does exist return to login page, if not, redirect to failed.
//Uses passport to login.
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/failed'
}));

//Logout
// destroys any session, redirects to index page
router.get('/logout', function (req, res) {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

/**********************************************************/
/* END END END
/**********************************************************/


router.get('/', function(req, res){
  res.render('index')
});
router.route('/insert')
.post(function(req,res) {
 var expense = new Expense();
  expense.description = req.body.desc;
  expense.amount = req.body.amount;
  expense.month = req.body.month;
  expense.year = req.body.year;
expense.save(function(err) {
      if (err)
        res.send(err);
      res.send('Expense successfully added!');
  });
})
router.route('/update')
.post(function(req, res) {
 const doc = {
     description: req.body.description,
     amount: req.body.amount,
     month: req.body.month,
     year: req.body.year
 };
 console.log(doc);
  Expense.update({_id: req.body._id}, doc, function(err, result) {
      if (err)
        res.send(err);
      res.send('Expense successfully updated!');
  });
});
router.get('/delete', function(req, res){
 var id = req.query.id;
 Expense.find({_id: id}).remove().exec(function(err, expense) {
  if(err)
   res.send(err)
  res.send('Expense successfully deleted!');
 })
});
router.get('/getAll',function(req, res) {
 var monthRec = req.query.month;
 var yearRec = req.query.year;
 if(monthRec && monthRec != 'All'){
  Expense.find({$and: [ {month: monthRec}, {year: yearRec}]}, function(err, expenses) {
   if (err)
    res.send(err);
   res.json(expenses);
  });
 } else {
  Expense.find({year: yearRec}, function(err, expenses) {
   if (err)
    res.send(err);
   res.json(expenses);
  });
 }
});
module.exports = router;