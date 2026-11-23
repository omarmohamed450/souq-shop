const express = require('express');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const itemRoutes = require('./itemRoutes');
const orderRoutes = require('./orderRoutes');
const managerRoutes = require('./managerRoutes');
const paymentRoutes = require('./paymentRoutes');

const router = express.Router();

// Health check
router.get('/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Authentication routes
router.use('/auth', authRoutes);

// Public routes
router.use('/categories', categoryRoutes);
router.use('/items', itemRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);

// Manager routes
router.use('/manager', managerRoutes);

module.exports = router;
