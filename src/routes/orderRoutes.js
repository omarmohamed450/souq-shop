const express = require('express');
const { param } = require('express-validator');
const orderController = require('../controllers/orderController');
const { createOrderValidation } = require('../validations/orderValidation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.post('/', createOrderValidation, validate, orderController.createOrder);
router.get(
    '/:id/payment-status',
    param('id').isMongoId().withMessage('Invalid order id'),
    validate,
    orderController.getPaymentStatus
);

module.exports = router;
