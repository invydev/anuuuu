const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File paths
const dataDir = path.join(__dirname, 'database');
const stockFile = path.join(dataDir, 'stock.json');
const historyFile = path.join(dataDir, 'history.json');
const usersFile = path.join(dataDir, 'users.json');

// Ensure data directory exists
fs.ensureDirSync(dataDir);

// Initialize files if they don't exist
if (!fs.existsSync(stockFile)) {
    fs.writeJsonSync(stockFile, {
        stock: { VIP7D: [], VIP30D: [] },
        prices: { VIP7D: 20000, VIP30D: 60000 }
    });
}

if (!fs.existsSync(historyFile)) {
    fs.writeJsonSync(historyFile, []);
}

if (!fs.existsSync(usersFile)) {
    fs.writeJsonSync(usersFile, { total_users: 0, active_users: 0, users: {} });
}

// API Routes
app.get('/api/stock', (req, res) => {
    const stock = fs.readJsonSync(stockFile);
    res.json(stock);
});

app.post('/api/stock', (req, res) => {
    fs.writeJsonSync(stockFile, req.body);
    res.json({ success: true, message: 'Stock updated' });
});

app.get('/api/history/:userId', (req, res) => {
    const history = fs.readJsonSync(historyFile);
    const userHistory = history.filter(h => h.userId === req.params.userId);
    res.json(userHistory);
});

app.post('/api/history', (req, res) => {
    const history = fs.readJsonSync(historyFile);
    history.unshift(req.body);
    fs.writeJsonSync(historyFile, history);
    res.json({ success: true, message: 'History added' });
});

app.post('/api/payment/qris', async (req, res) => {
    try {
        const { amount } = req.body;
        const response = await axios.get(
            `https://rumahotp.com/api/v1/deposit/create?amount=${amount}&payment_id=qris`,
            {
                headers: {
                    'x-apikey': process.env.RUMAH_OTP_KEY,
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/payment/status/:id', async (req, res) => {
    try {
        const response = await axios.get(
            `https://rumahotp.com/api/v1/deposit/get_status?deposit_id=${req.params.id}`,
            {
                headers: {
                    'x-apikey': process.env.RUMAH_OTP_KEY,
                    'Accept': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
