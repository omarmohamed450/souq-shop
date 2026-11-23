const express = require('express');
const { param } = require('express-validator');
const managerItemController = require('../controllers/managerItemController');
const { createItemValidation, updateItemValidation } = require('../validations/itemValidation');
const validate = require('../middlewares/validate');
const { uploadItemImage } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', managerItemController.listItems);
router.get(
    '/:id',
    param('id').isMongoId().withMessage('Invalid item id'),
    validate,
    managerItemController.getItem
);
router.post(
    '/',
    uploadItemImage,
    createItemValidation,
    validate,
    managerItemController.createItem
);
router.put(
    '/:id',
    uploadItemImage,
    param('id').isMongoId().withMessage('Invalid item id'),
    updateItemValidation,
    validate,
    managerItemController.updateItem
);
router.patch(
    '/:id',
    uploadItemImage,
    param('id').isMongoId().withMessage('Invalid item id'),
    updateItemValidation,
    validate,
    managerItemController.updateItem
);
router.delete(
    '/:id',
    param('id').isMongoId().withMessage('Invalid item id'),
    validate,
    managerItemController.deleteItem
);

module.exports = router;
