require('dotenv').config();

const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose');
mongoose.Promise = Promise; // REALLY???
const dbUrl = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DB}`;
mongoose.connect(dbUrl, { useMongoClient: true }).catch(error => console.log(error));

const User = require("./models/user.js");
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

app.get('/api/exercise/users', (req, res) => {
  if(req.body && req.body.username) {
    User.findOne({ username: req.body.username }, function(err, user_document) {
      if (err) {
        res.sendStatus(500);
        console.log(err);
        return;
      }

      if (user_document !== null) {
        User.find({}, function(err, users) {
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
