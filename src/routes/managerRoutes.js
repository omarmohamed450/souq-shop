const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const managerCategoryRoutes = require('./managerCategoryRoutes');
const managerItemRoutes = require('./managerItemRoutes');
const managerOrderRoutes = require('./managerOrderRoutes');
const managerSettingsRoutes = require('./managerSettingsRoutes');
const managerEmailTemplateRoutes = require('./managerEmailTemplateRoutes');
const managerEmailRoutes = require('./managerEmailRoutes');
const managerOrderController = require('../controllers/managerOrderController');

const router = express.Router();

router.use(protect);

router.use('/categories', managerCategoryRoutes);
router.use('/items', managerItemRoutes);
router.use('/orders', managerOrderRoutes);
router.use('/settings', managerSettingsRoutes);
router.use('/email-templates', managerEmailTemplateRoutes);
router.use('/emails', managerEmailRoutes);
router.get('/customers', managerOrderController.listCustomers);

module.exports = router;
