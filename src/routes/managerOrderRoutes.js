const express = require('express');
const { param } = require('express-validator');
const managerOrderController = require('../controllers/managerOrderController');
const {
    updateOrderStatusValidation,
    addOrderNoteValidation
} = require('../validations/orderValidation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/', managerOrderController.listOrders);
router.get(
    '/:id',
    param('id').isMongoId().withMessage('Invalid order id'),
    validate,
    managerOrderController.getOrder
);
router.patch(
    '/:id/status',
    param('id').isMongoId().withMessage('Invalid order id'),
    updateOrderStatusValidation,
    validate,
    managerOrderController.updateOrderStatus
);
router.post(
    '/:id/notes',
    param('id').isMongoId().withMessage('Invalid order id'),
    addOrderNoteValidation,
    validate,
    managerOrderController.addOrderNote
);
router.post(
    '/:id/approve',
    param('id').isMongoId().withMessage('Invalid order id'),
    validate,
    managerOrderController.approveOrder
);
router.post(
    '/:id/reject',
    param('id').isMongoId().withMessage('Invalid order id'),
    validate,
    managerOrderController.rejectOrder
);

module.exports = router;
