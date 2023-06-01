const yahooFinance = require('yahoo-finance');
const express = require('express');
const axios = require('axios');
const http = require('http');
const app = express();
const port = 3000;
const path = require('path');
const { MongoClient, ObjectID } = require('mongodb');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const expressSession = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

app.use(express.static('frontend'));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const uri = "mongodb+srv://eerivas:fortytwo@cluster0.aiuixka.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

/** PassportJS Authentication **/

app.use(expressSession({
  secret: 'some secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    async function(username, password, done) {
      try {
        const user = await getUser(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      } catch (error) {
        console.error('Error in Passport strategy:', error);
        return done(error);
      }
    }
  ));
  

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(async function(id, done) {
  const user = await getUserById(id);
  done(null, user);
});

/** POST Login Request */

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { 
            return next(err); 
        }
        if (!user) { 
            return res.status(400).json({ success: false, message: info.message }); 
        }
        req.logIn(user, function(err) {
            if (err) { 
            return next(err); 
            }
            return res.json({ success: true });
        });
    })(req, res, next);
});
  
async function getUser(username) {
    await client.connect();
    const db = client.db('bof-game'); // replace 'test' with your database name
    const users = db.collection('users'); // replace 'users' with your collection name
    const user = await users.findOne({ username: username });
    console.log("Fetched user: ", user);  // add this line
    return user;
  }
  

async function getUserById(id) {
  await client.connect();
  const db = client.db('bof-game'); // replace 'test' with your database name
  const users = db.collection('users'); // replace 'users' with your collection name
  return await users.findOne({ _id: id });
};
  

/** POST Register Request */

const saltRounds = 10;

app.post('/register', async (req, res) => {
    try {
      const { username, password, score } = req.body;
  
      const hashedPassword = bcrypt.hashSync(password, saltRounds);
  
      await client.connect();
      const database = client.db('bof-game'); // replace 'test' with your database name
      const collection = database.collection('users'); // replace 'users' with your collection name
  
      // Check if the user already exists
      const existingUser = await collection.findOne({ username: username });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }
  
      const user = { username: username, password: hashedPassword, highScore: score };
  
      await collection.insertOne(user);
  
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error occurred');
    }
});
  

app.get('/leaderboard', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('bof-game');
        const collection = database.collection('users');

        // Use sort and limit to get the top 20 high scores
        const topUsers = await collection.find().sort({ highScore: -1 }).limit(20).toArray();
        res.json(topUsers);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred');
    } finally {
        await client.close();
    }
});


/** MongoDB */
app.get('/user-score', async (req, res) => {
    const { username } = req.query;
    // Fetch user score from your database...
    await client.connect();
    const db = client.db('bof-game');
    const users = db.collection('users')

    const userScore = await users.findOne({ username: username});
    res.json({ highScore: userScore });
});
  

app.post('/update-score', async (req, res) => {
    const { username, score } = req.body;

    try {
        await client.connect();
        const database = client.db('bof-game');
        const collection = database.collection('users');
        const user = await collection.findOne({ username: username });

        // Always updates score
        if (true) {
            const update = {
                $set: {
                    highScore: score,
                },
            };
            const options = { upsert: true };
            const result = await collection.updateOne({ username: username }, update, options);
        }

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error occurred');

    } finally {
        await client.close();
    }
});


/** GET Request that obtains information of a desired stock, specifically for graphing the chart */

app.get('/stock-data', async (req, res) => {
    try {
      // Make the API request to Yahoo Finance API
      const response = await axios.get(`https://query1.finance.yahoo.com/v7/finance/chart/${req.query.symbol}?range=12mo&interval=1d`);
  
      // Forward the API response to the client
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error occurred');
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
