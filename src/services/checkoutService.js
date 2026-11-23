const orderService = require('./orderService');
const paymentService = require('./paymentService');

const createCheckoutOrder = async (payload) => {
    const order = await orderService.createOrder(payload);

    try {
        const session = await paymentService.createCheckoutSession(order);
        const updatedOrder = await orderService.getOrderById(order._id);

        return {
            order: updatedOrder,
            checkoutUrl: session.url
        };
    } catch (error) {
        try {
            await orderService.deleteOrder(order._id);
        } catch (cleanupError) {
            console.error(
                `Failed to remove unpaid order after Stripe error: ${cleanupError.message}`
            );
        }

        throw error;
    }
};

module.exports = { createCheckoutOrder };
