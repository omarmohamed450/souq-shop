const settingsService = require('../services/settingsService');

const getSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.getPublicSettings();

        res.status(200).json({
            success: true,
            data: { settings }
        });
    } catch (error) {
        next(error);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.updateSettings(req.body);

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: { settings }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSettings, updateSettings };
