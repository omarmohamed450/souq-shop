const express = require('express');
const { param } = require('express-validator');
const managerEmailTemplateController = require('../controllers/managerEmailTemplateController');
const { emailTemplateValidation } = require('../validations/emailTemplateValidation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.get('/', managerEmailTemplateController.listTemplates);
router.get(
    '/:id',
    param('id').isMongoId().withMessage('Invalid email template id'),
    validate,
    managerEmailTemplateController.getTemplate
);
router.post(
    '/',
    emailTemplateValidation,
    validate,
    managerEmailTemplateController.createTemplate
);
router.put(
    '/:id',
    param('id').isMongoId().withMessage('Invalid email template id'),
    emailTemplateValidation,
    validate,
    managerEmailTemplateController.updateTemplate
);
router.delete(
    '/:id',
    param('id').isMongoId().withMessage('Invalid email template id'),
    validate,
    managerEmailTemplateController.deleteTemplate
);

module.exports = router;
