const { body } = require('express-validator');

const createCategoryValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 2, max: 80 })
        .withMessage('Category name must be between 2 and 80 characters'),
    body('description')
        .optional()
        .isString()
        .withMessage('Category description must be a string')
        .isLength({ max: 500 })
        .withMessage('Category description must be at most 500 characters')
];

const updateCategoryValidation = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Category name cannot be empty')
        .isLength({ min: 2, max: 80 })
        .withMessage('Category name must be between 2 and 80 characters'),
    body('description')
        .optional()
        .isString()
        .withMessage('Category description must be a string')
        .isLength({ max: 500 })
        .withMessage('Category description must be at most 500 characters')
];

module.exports = { createCategoryValidation, updateCategoryValidation };
