const emailTemplateService = require('../services/emailTemplateService');

const listTemplates = async (req, res, next) => {
    try {
        const templates = await emailTemplateService.listTemplates();

        res.status(200).json({
            success: true,
            data: {
                templates,
                placeholders: emailTemplateService.PLACEHOLDERS
            }
        });
    } catch (error) {
        next(error);
    }
};

const getTemplate = async (req, res, next) => {
    try {
        const template = await emailTemplateService.getTemplateById(req.params.id);

        res.status(200).json({
            success: true,
            data: { template }
        });
    } catch (error) {
        next(error);
    }
};

const createTemplate = async (req, res, next) => {
    try {
        const template = await emailTemplateService.createTemplate(req.body);

        res.status(201).json({
            success: true,
            message: 'Email template created successfully',
            data: { template }
        });
    } catch (error) {
        next(error);
    }
};

const updateTemplate = async (req, res, next) => {
    try {
        const template = await emailTemplateService.updateTemplate(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: 'Email template updated successfully',
            data: { template }
        });
    } catch (error) {
        next(error);
    }
};

const deleteTemplate = async (req, res, next) => {
    try {
        await emailTemplateService.deleteTemplate(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Email template deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate
};
