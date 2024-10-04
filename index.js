const express = require('express');
const session = require('express-session');
const hbs = require('express-handlebars').create;
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const axios = require('axios');
const path = require('path');
const Coin = require('./models/Coin');
const openaiApiKey = process.env.OPENAI_API_KEY;
const coinGeckoApiKey = process.env.COINGECKO_API_KEY;

const faqQuestions = [
  "How are market cap and circulating supply connected?",
  "What can we learn from volume and price trends?",
  "Why does market cap fluctuate, and what should I consider?",
  "What does 24-hour price change mean for short-term investments?",
  "What key metrics should I watch for long-term performance?",
  "How does volatility affect a coin's investment appeal?",
  "How does volume impact a coin's price stability?",
  "Why is circulating supply crucial for a coin’s price?",
  "How do external factors affect a coin's market cap?"
];

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

const corsOptions = {
  origin: 'http://localhost:5001',
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


// Middleware to serve static files
app.use(express.static('public'));

// Middleware for parsing JSON and urlencoded data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Define connectDB function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB is connected');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};

// User Schema and Model
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  favourites: {
    type: [String],
    default: []
  }
});

const User = mongoose.model('User', UserSchema);

// Setup Handlebars
const handlebars = hbs({ extname: '.hbs' });
app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Setup session middleware
app.use(session({
  secret: "verygoodsecret",
  resave: false,
  saveUninitialized: true
}));

// Passport.js
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).exec();
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username }).exec();
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

function isLoggedOut(req, res, next) {
  if (!req.isAuthenticated()) return next();
  res.redirect('/');
}

app.get('/auth/check', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: { username: req.user.username } });
  } else {
    res.json({ authenticated: false });
  }
});

function validatePassword(req, res, next) {
  const { password } = req.body;

  const minLength = 8;
  const specialCharCount = 2;

  if (password.length < minLength) {
    return res.redirect('/register?error=Password must be at least ' + minLength + ' characters long');
  }

  const specialChars = password.replace(/[a-zA-Z0-9]/g, '');
  if (specialChars.length < specialCharCount) {
    return res.redirect('/register?error=Password must contain at least ' + specialCharCount + ' special characters');
  }

  next();
}

// Validate new password
function validateNewPassword(req, res, next) {
  const { newPassword } = req.body;

  const minLength = 8;
  const specialCharCount = 2;

  if (newPassword.length < minLength) {
    return res.redirect('/reset-password?error=Password must be at least ' + minLength + ' characters long');
  }

  const specialChars = newPassword.replace(/[a-zA-Z0-9]/g, '');
  if (specialChars.length < specialCharCount) {
    return res.redirect('/reset-password?error=Password must contain at least ' + specialCharCount + ' special characters');
  }

  next();
}

// Reset password
app.post('/reset-password', validateNewPassword, async (req, res, next) => {
  const { username, newPassword } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.redirect('/reset-password?error=Invalid Username Entered');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.redirect('/login');
  } catch (err) {
    next(err);
  }
});


// ROUTES
app.get('/reset-password', isLoggedOut, (req, res) => {
  const error = req.query.error || '';
  res.render('reset-password', { error });
});

app.get('/login', isLoggedOut, (req, res) => {
  const response = {
    title: "Login",
    error: req.query.error
  };
  res.render('login', response);
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      // Authentication failed, redirect back to login with error message
      return res.render('login', { error: true });
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      // Authentication successful, redirect to homepage or desired route
      return res.redirect('/');
    });
  })(req, res, next);
});

app.get('/register', isLoggedOut, (req, res) => {
  const error = req.query.error || '';
  res.render('register', { error });
});

app.post('/register', validatePassword, async (req, res, next) => {
  const { username, password, email } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.redirect('/register?error=These login credentials have already been used');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword,
      email
    });

    await newUser.save();

    // Use req.logIn to log the user in after registration
    req.logIn(newUser, (err) => {
      if (err) {
        return next(err);
      }
      // Redirect to the homepage or desired route after successful login
      return res.redirect('/'); 
    });
  } catch (err) {
    next(err);
  }
});

// Reset password
app.post('/reset-password', validateNewPassword, async (req, res, next) => {
  const { username, newPassword } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.redirect('/reset-password?error=Username Does Not Exist');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.redirect('/login');
  } catch (err) {
    next(err);
  }
});

app.post('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      return next(err);
    }
    res.status(200).json({ message: 'Successfully logged out' });
  });
});


// Setup initial admin user
app.get('/setup', async (req, res) => {
  const exists = await User.exists({ username: "admin" });

  if (exists) {
    res.redirect('/login');
    return;
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash("pass", salt, (err, hash) => {
      if (err) return next(err);
      const newAdmin = new User({
        username: "admin",
        password: hash
      });

      newAdmin.save();
      res.redirect('/login');
    });
  });
});


//Routes for investor watchlist
app.get('/favourites', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'protected', 'coinsfavourite.html'));
});

app.get('/api/favourites', isAuthenticated, async (req, res) => {
  try {
      const user = await User.findById(req.user.id).exec();
      const favoriteCoinIds = user.favourites || [];

      // Fetch details for each favorite coin
      const favoriteCoins = await Coin.find({ id: { $in: favoriteCoinIds } })
          .sort({ market_cap: -1 }) 
          .exec();

      res.json(favoriteCoins);
  } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).send('Server Error');
  }
});

app.post('/favourites/add', isAuthenticated, async (req, res) => {
  const { coinId } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { favourites: coinId } }, // $addToSet ensures the coinId is not added if it already exists
      { new: true }
    ).exec();

    res.status(200).json(user.favourites);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).send('Server Error');
  }
});

app.post('/favourites/remove', isAuthenticated, async (req, res) => {
  const { coinId } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { favourites: coinId } }, // $pull removes the coinId if it exists
      { new: true }
    ).exec();

    res.status(200).json(user.favourites);
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).send('Server Error');
  }
});

//Middleware to serve protected files
app.use('/protected', isAuthenticated, express.static(path.join(__dirname, 'public', 'protected')));

// Serve HTML pages with authentication check
app.get('/marksum', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'protected', 'marksum.html'));
});

app.get('/coins', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'protected', 'coins.html'));
});

app.get('/faq', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'protected', 'faq.html'));
});

//Route to handle chatbot requests
app.post('/faq/chatbot', async (req, res) => {
  const { prompt } = req.body;

  if (faqQuestions.includes(prompt)) {
      try {
          const structuredPrompt = `You are an expert in cryptocurrency. Please provide a detailed answer to the following question: "${prompt}". 
          Format your response using bullet points for clarity, and ensure each bullet point starts with a gem symbol (◆).`;

          const response = await axios({
              method: 'post',
              url: 'https://api.openai.com/v1/chat/completions',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
              },
              data: {
                  model: 'gpt-3.5-turbo',
                  messages: [{ role: 'user', content: structuredPrompt }],
                  max_tokens: 400
              }
          });

          const gptResponse = response.data.choices[0].message.content.trim();  
          res.status(200).send(gptResponse);

      } catch (error) {
          console.error('Error with GPT API:', error.response ? error.response.data : error.message);
          res.status(500).json({ error: 'Something went wrong' });
      }
  } else {
      res.status(400).json({ error: 'Invalid question selected.' });
  }
});

// Route to handle generating insights from chart data
app.post('/api/generate-insights', async (req, res) => {
  const { chartData, selectedRelationship } = req.body;

  const structuredPrompt = `Based on the following cryptocurrency data, please provide insights formatted with bullet points only:
  Relationship: ${selectedRelationship}
  Data: ${JSON.stringify(chartData)}

  Ensure that your response consists of bullet points starting with a gem symbol (◆) for clarity.`;

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      data: {
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: structuredPrompt
          }
        ],
        max_tokens: 400,
      }
    });

    const fullResponse = response.data.choices[0].message.content.trim();  
    res.json({ insights: fullResponse });

  } catch (error) {
    console.error('Error with GPT API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error with GPT API: ' + (error.response ? error.response.data : error.message) });
  }
});

// Serve the new index.html page
app.get('/', isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'protected', 'index.html')); 
});


//Middleware to serve React
app.get('/:coinId', isAuthenticated, (req, res) => {
  const coinId = req.params.coinId;
  const validCoins = ['bitcoin', 'ethereum', 'binancecoin', 'tether', 'usd-coin', 'ripple', 'cardano', 'dogecoin', 'solana', 'polkadot'];
  
   if (validCoins.includes(coinId)) {
      res.sendFile(path.join(__dirname, 'src', `${coinId}.js`));
  } else {
      res.status(404).send('Not Found');
  }
});
  
  // Middleware to check authentication
  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'You Are Not Authorized' });
  }

// Fetch data from CoinGecko
const fetchCoinGeckoData = async () => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        ids: 'bitcoin,ethereum,binancecoin,tether,usd-coin,ripple,cardano,dogecoin,solana,polkadot',
        x_cg_demo_api_key: process.env.COINGECKO_API_KEY,
        order: 'market_cap_desc'
      }
    });
    console.log('Data fetched from CoinGecko:', response.data);
    return response.data;
  } catch (err) {
    console.error('Error fetching data from CoinGecko:', err.message);
    return [];
  }
};

// Call connectDB function
connectDB().then(async () => {
  const saveDataToDB = async () => {
    const data = await fetchCoinGeckoData();
    await Coin.deleteMany({});
    data.forEach(async (coin) => {
      await Coin.findOneAndUpdate(
        { id: coin.id, last_updated: coin.last_updated },
        coin,
        { upsert: true, new: true }
      );
    });
  };

  app.get('/api/cryptocurrencies', async (req, res) => {
    try {
      const coins = await Coin.find().sort({ market_cap: -1 });
      res.json(coins);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  await saveDataToDB();
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});
