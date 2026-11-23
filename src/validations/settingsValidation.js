const { body } = require('express-validator');

const updateSettingsValidation = [
    body('autoApproveOrders')
        .optional()
        .isBoolean()
        .withMessage('autoApproveOrders must be a boolean')
        .toBoolean(),
    body('storefrontUrl')
        .optional()
        .isString()
        .withMessage('Storefront URL must be a string')
        .isURL({ require_tld: false })
        .withMessage('Storefront URL must be a valid URL'),
    body('currency')
        .optional()
        .isString()
        .withMessage('Currency must be a string')
        .isLength({ min: 3, max: 3 })
        .withMessage('Currency must be a 3-letter code')
        .isAlpha()
        .withMessage('Currency must contain letters only'),
    body('stripeSecretKey')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('Stripe secret key must be a string')
        .isLength({ max: 500 })
        .withMessage('Stripe secret key is too long'),
    body('stripeWebhookSecret')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('Stripe webhook secret must be a string')
        .isLength({ max: 500 })
        .withMessage('Stripe webhook secret is too long'),
    body('clearStripeSecretKey').optional().isBoolean().toBoolean(),
    body('clearStripeWebhookSecret').optional().isBoolean().toBoolean(),
    body('smtpHost')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('SMTP host must be a string')
        .isLength({ max: 255 })
        .withMessage('SMTP host is too long'),
    body('smtpPort')
        .optional()
        .isInt({ min: 1, max: 65535 })
        .withMessage('SMTP port must be between 1 and 65535')
        .toInt(),
    body('smtpSecure')
        .optional()
        .isBoolean()
        .withMessage('smtpSecure must be a boolean')
        .toBoolean(),
    body('smtpUser')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('SMTP user must be a string')
        .isLength({ max: 255 })
        .withMessage('SMTP user is too long'),
    body('smtpPassword')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('SMTP password must be a string')
        .isLength({ max: 500 })
        .withMessage('SMTP password is too long'),
    body('clearSmtpPassword').optional().isBoolean().toBoolean(),
    body('smtpFromName')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('SMTP from name must be a string')
        .isLength({ max: 120 })
        .withMessage('SMTP from name is too long'),
    body('smtpFromEmail')
        .optional({ values: 'falsy' })
        .isEmail()
        .withMessage('SMTP from email must be a valid email address')
        .isLength({ max: 120 })
        .withMessage('SMTP from email is too long')
];

module.exports = { updateSettingsValidation };
