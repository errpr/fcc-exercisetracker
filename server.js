require('dotenv').config();

const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose');
mongoose.Promise = Promise; // REALLY???
const dbUrl = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DB}`;
mongoose.connect(dbUrl, { useMongoClient: true }).catch(error => console.log(error));

const User = require("./models/User.js");
app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  if(req.body && req.body.username) {
    let new_user = new User({ username: req.body.username });
    new_user.save(function (err, user_document) {
      if (err) {
        if (err.message.substring(0, 26) == 'E11000 duplicate key error') {
          res.status(403).send("User already exists");
          return;
        }

        res.sendStatus(500);
        console.log(err);
        return;
      }

      res.json(user_document);
    });
  }
});

app.post('/api/exercise/add', (req, res) => {
  if(req.body &&
     req.body.userId &&
     req.body.description &&
     req.body.duration) {
    
    let postDate = Date.now();
    if (req.body.date) { postDate = Date.parse(req.body.date) }
    
    User.findById(req.body.userId, function(err, user) {
      if(err) {
        res.sendStatus(404);
        console.log(err);
        return;
      }

      const new_exercise = {
        description: req.body.description,
        duration: req.body.duration,
        postDate: postDate
      }

      user.exercises.push(new_exercise);

      user.save(function(err) {
        if (err) {
          res.sendStatus(500);
          console.log(err);
          return;
        }

        res.json({
          ...new_exercise,
          _id: user._id,
          username: user.username
        });
      });
    });
  } else {
    res.sendStatus(400);
  }
});

app.get('/api/exercise/users', (req, res) => {
  if(req.query && req.query.username) {
    User.findOne({ username: req.query.username }, function(err, user_document) {
      if (err) {
        res.sendStatus(500);
        console.log(err);
        return;
      }

      if (user_document !== null) {
        User.find({}).select("_id username").exec(function(err, users) {
          res.json(users);
        });
      } else {
        res.sendStatus(403);
      }
    });
  } else {
    res.sendStatus(403);
  }
});

app.get('/api/exercise/log', (req, res) => {
  if(req.query && req.query.userId) {
    let fromDate = new Date(0);
    let toDate = Date.now()
    let limit = Infinity;
    
    if (req.query.from) fromDate = Date.parse(req.query.from);
    if (req.query.to) toDate = Date.parse(req.query.to);
    if (req.query.limit) limit = Number.parseInt(req.query.limit);

    User.findById(req.query.userId, function(err, user) {
      if(err) {
        res.sendStatus(500);
        console.log(err);
        return;
      }

      if(user === null) {
        res.sendStatus(404);
        return;
      }

      exercise_log = user.exercises
                        .filter(e => e.postDate >= fromDate)
                        .filter(e => e.postDate <= toDate)
                        .sort((a, b) => b.postDate - a.postDate)
                        .slice(0, limit);
      res.json({
        log: exercise_log,
        count: exercise_log.length,
        username: user.username,
        _id: user._id
      });
    });
  } else {
    res.sendStatus(403);
  }
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
