const express = require('express');
const managerSettingsController = require('../controllers/managerSettingsController');
const { updateSettingsValidation } = require('../validations/settingsValidation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/', managerSettingsController.getSettings);
router.put(
    '/',
    updateSettingsValidation,
    validate,
    managerSettingsController.updateSettings
);

module.exports = router;
