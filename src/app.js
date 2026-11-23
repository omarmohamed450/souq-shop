const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security & Standard Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors());

// Stripe requires the raw request body to verify webhook signatures
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API Routes
app.use('/api', apiRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;