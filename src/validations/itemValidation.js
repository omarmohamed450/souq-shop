const { body } = require('express-validator');

const parseCategories = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        return value;
    }
};

const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;

    return value;
};

const baseItemFields = () => [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Item name is required')
        .isLength({ min: 2, max: 120 })
        .withMessage('Item name must be between 2 and 120 characters'),
    body('description')
        .optional()
        .isString()
        .withMessage('Item description must be a string')
        .isLength({ max: 2000 })
        .withMessage('Item description must be at most 2000 characters'),
    body('price')
        .notEmpty()
        .withMessage('Item price is required')
        .isFloat({ min: 0 })
        .withMessage('Item price must be a non-negative number')
        .toFloat(),
    body('quantity')
        .notEmpty()
        .withMessage('Item quantity is required')
        .isInt({ min: 0 })
        .withMessage('Item quantity must be a non-negative integer')
        .toInt(),
    body('imageUrl')
        .optional()
        .isString()
        .withMessage('Image URL must be a string')
        .isLength({ max: 2048 })
        .withMessage('Image URL must be at most 2048 characters'),
    body('isHidden')
        .optional()
        .customSanitizer(parseBoolean)
        .isBoolean()
        .withMessage('isHidden must be a boolean')
];

const createItemValidation = [
    ...baseItemFields(),
    body('categories')
        .customSanitizer(parseCategories)
        .isArray({ min: 1 })
        .withMessage('Item must belong to at least one category'),
    body('categories.*')
        .isMongoId()
        .withMessage('Each category must have a valid id')
];

const updateItemValidation = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Item name cannot be empty')
        .isLength({ min: 2, max: 120 })
        .withMessage('Item name must be between 2 and 120 characters'),
    body('description')
        .optional()
        .isString()
        .withMessage('Item description must be a string')
        .isLength({ max: 2000 })
        .withMessage('Item description must be at most 2000 characters'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Item price must be a non-negative number')
        .toFloat(),
    body('quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Item quantity must be a non-negative integer')
        .toInt(),
    body('categories')
        .optional()
        .customSanitizer(parseCategories)
        .isArray({ min: 1 })
        .withMessage('Item must belong to at least one category'),
    body('categories.*')
        .isMongoId()
        .withMessage('Each category must have a valid id'),
    body('imageUrl')
        .optional()
        .isString()
        .withMessage('Image URL must be a string')
        .isLength({ max: 2048 })
        .withMessage('Image URL must be at most 2048 characters'),
    body('isHidden')
        .optional()
        .customSanitizer(parseBoolean)
        .isBoolean()
        .withMessage('isHidden must be a boolean')
];

module.exports = { createItemValidation, updateItemValidation };
