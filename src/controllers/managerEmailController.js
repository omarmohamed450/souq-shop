const emailTemplateService = require('../services/emailTemplateService');
const mailService = require('../services/mailService');
const orderService = require('../services/orderService');
const ApiError = require('../utilities/ApiError');

const sendEmail = async (req, res, next) => {
    try {
        const { to, templateId, orderId } = req.body;
        let { subject, body } = req.body;

        if (templateId) {
            const template = await emailTemplateService.getTemplateById(templateId);
            subject = subject || template.subject;
            body = body || template.body;
        }

        if (!subject || !subject.trim()) {
            throw new ApiError(400, 'Email subject is required');
        }

        if (!body || !body.trim()) {
            throw new ApiError(400, 'Email body is required');
        }

        const order = orderId ? await orderService.getOrderById(orderId) : null;
        const result = await mailService.sendManualEmail({
            to,
            subject,
            body,
            order
        });

        res.status(200).json({
            success: true,
            message:
                result.mode === 'development'
                    ? 'Email accepted in development mode. Check the server logs.'
                    : 'Email sent successfully',
            data: { delivery: result }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { sendEmail };
