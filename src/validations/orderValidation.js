const { body } = require('express-validator');

const createOrderValidation = [
    body('customer.name')
        .trim()
        .notEmpty()
        .withMessage('Customer name is required')
        .isLength({ max: 120 })
        .withMessage('Customer name must be at most 120 characters'),
    body('customer.phone')
        .trim()
        .notEmpty()
        .withMessage('Customer phone is required')
        .isLength({ max: 30 })
        .withMessage('Customer phone must be at most 30 characters'),
    body('customer.address')
        .trim()
        .notEmpty()
        .withMessage('Customer address is required')
        .isLength({ max: 500 })
        .withMessage('Customer address must be at most 500 characters'),
    body('customer.email')
        .trim()
        .notEmpty()
        .withMessage('Customer email is required')
        .isEmail()
        .withMessage('Customer email must be a valid email address')
        .isLength({ max: 120 })
        .withMessage('Customer email must be at most 120 characters'),
    body('notes')
        .optional()
        .isString()
        .withMessage('Order notes must be a string')
        .isLength({ max: 1000 })
        .withMessage('Order notes must be at most 1000 characters'),
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    body('items.*.itemId')
        .isMongoId()
        .withMessage('Each order item must have a valid itemId'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Each order item quantity must be a positive integer')
        .toInt()
];

const updateOrderStatusValidation = [
    body('status')
        .isIn(['opened', 'in-transit', 'closed'])
        .withMessage('Order status must be opened, in-transit, or closed')
];

const addOrderNoteValidation = [
    body('text')
        .isString()
        .withMessage('Note text must be a string')
        .trim()
        .notEmpty()
        .withMessage('Note text is required')
        .isLength({ max: 1000 })
        .withMessage('Note text must be at most 1000 characters')
];

module.exports = {
    createOrderValidation,
    updateOrderStatusValidation,
    addOrderNoteValidation
};
