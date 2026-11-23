const express = require('express');
const { param } = require('express-validator');
const itemController = require('../controllers/itemController');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/', itemController.listItems);
router.get(
    '/:id',
    param('id').isMongoId().withMessage('Invalid item id'),
    validate,
    itemController.getItem
);

module.exports = router;
