const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Coin = require('./models/Coin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to serve static files
app.use(express.static('public'));

// Define connectDB function
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/cryptoniteDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB is connected');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
};

// Fetch data from CoinGecko
const fetchCoinGeckoData = async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                ids: 'bitcoin,ethereum,litecoin,binancecoin,tether,usd-coin,ripple,cardano,dogecoin,solana,polkadot' , 
                x_cg_demo_api_key: 'CG-Wm8gQ94HTxYGWX6LFNvzJ6gi',
                order: 'market_cap_desc' // Order by market cap descending
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
    // Fetch Data and Save to MongoDB
    const saveDataToDB = async () => {
        const data = await fetchCoinGeckoData(); // Fetch data for multiple coins
        data.forEach(async (coin) => {
            await Coin.findOneAndUpdate(
                { id: coin.id, last_updated: coin.last_updated }, // Match based on id and last_updated
                coin, // Update with new data
                { upsert: true, new: true } // Create new if doesn't exist
            );
        });
    };

    // Route to Fetch Data from Database
    app.get('/api/cryptocurrencies', async (req, res) => {
        try {
            const coins = await Coin.find().sort({ market_cap: -1 });
            res.json(coins);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // Fetch and Save Data to MongoDB at Startup
    saveDataToDB();

    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    }).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    });



