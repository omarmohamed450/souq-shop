const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
