const { body } = require('express-validator');

const emailTemplateValidation = [
    body('key')
        .trim()
        .notEmpty()
        .withMessage('Template key is required')
        .matches(/^[a-z0-9_]+$/)
        .withMessage(
            'Template key may contain only lowercase letters, numbers, and underscores'
        )
        .isLength({ max: 80 })
        .withMessage('Template key must be at most 80 characters'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Template name is required')
        .isLength({ max: 120 })
        .withMessage('Template name must be at most 120 characters'),
    body('subject')
        .trim()
        .notEmpty()
        .withMessage('Template subject is required')
        .isLength({ max: 200 })
        .withMessage('Template subject must be at most 200 characters'),
    body('body')
        .isString()
        .withMessage('Template body must be a string')
        .trim()
        .notEmpty()
        .withMessage('Template body is required')
        .isLength({ max: 20000 })
        .withMessage('Template body must be at most 20000 characters'),
    body('description')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('Template description must be a string')
        .isLength({ max: 500 })
        .withMessage('Template description must be at most 500 characters')
];

module.exports = { emailTemplateValidation };
