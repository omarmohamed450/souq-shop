const express = require('express');
const { param } = require('express-validator');
const managerCategoryController = require('../controllers/managerCategoryController');
const { createCategoryValidation, updateCategoryValidation } = require('../validations/categoryValidation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/', managerCategoryController.listCategories);
router.post('/', createCategoryValidation, validate, managerCategoryController.createCategory);
router.put(
    '/:id',
    param('id').isMongoId().withMessage('Invalid category id'),
    updateCategoryValidation,
    validate,
    managerCategoryController.updateCategory
);
router.patch(
    '/:id',
    param('id').isMongoId().withMessage('Invalid category id'),
    updateCategoryValidation,
    validate,
    managerCategoryController.updateCategory
);
router.delete(
    '/:id',
    param('id').isMongoId().withMessage('Invalid category id'),
    validate,
    managerCategoryController.deleteCategory
);

module.exports = router;
