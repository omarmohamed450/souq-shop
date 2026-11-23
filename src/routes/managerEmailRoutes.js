const express = require('express');
const managerEmailController = require('../controllers/managerEmailController');
const { sendEmailValidation } = require('../validations/emailValidation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.post(
    '/send',
    sendEmailValidation,
    validate,
    managerEmailController.sendEmail
);

module.exports = router;
