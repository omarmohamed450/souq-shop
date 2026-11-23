const express = require('express');
const authController = require('../controllers/authController');
const { loginValidation, changePasswordValidation } = require('../validations/authValidation');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', loginValidation, validate, authController.login);
router.get('/me', protect, authController.getProfile);
router.patch('/change-password', protect, changePasswordValidation, validate, authController.changePassword);

module.exports = router;
