const { body } = require('express-validator');

const sendEmailValidation = [
    body('to')
        .trim()
        .notEmpty()
        .withMessage('Recipient email is required')
        .isEmail()
        .withMessage('Recipient email must be a valid email address')
        .isLength({ max: 120 })
        .withMessage('Recipient email is too long'),
    body('templateId')
        .optional({ values: 'falsy' })
        .isMongoId()
        .withMessage('Invalid email template id'),
    body('orderId')
        .optional({ values: 'falsy' })
        .isMongoId()
        .withMessage('Invalid order id'),
    body('subject')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('Email subject must be a string')
        .isLength({ max: 200 })
        .withMessage('Email subject is too long'),
    body('body')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('Email body must be a string')
        .isLength({ max: 20000 })
        .withMessage('Email body is too long')
];

module.exports = { sendEmailValidation };
