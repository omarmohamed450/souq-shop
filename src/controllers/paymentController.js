const paymentService = require('../services/paymentService');

const handleWebhook = async (req, res, next) => {
    try {
        const event = await paymentService.constructWebhookEvent(
            req.body,
            req.headers['stripe-signature']
        );

        await paymentService.handleWebhookEvent(event);

        res.status(200).json({ received: true });
    } catch (error) {
        next(error);
    }
};

module.exports = { handleWebhook };
