const checkoutService = require('../services/checkoutService');
const orderService = require('../services/orderService');

const createOrder = async (req, res, next) => {
    try {
        const { customer, notes, items } = req.body;
        const result = await checkoutService.createCheckoutOrder({
            customer,
            notes,
            items
        });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully. Continue to payment.',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getPaymentStatus = async (req, res, next) => {
    try {
        const order = await orderService.getOrderById(req.params.id);

        res.status(200).json({
            success: true,
            data: {
                order: {
                    _id: order._id,
                    referenceNumber: order.referenceNumber,
                    totalPrice: order.totalPrice,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    approvalStatus: order.approvalStatus,
                    stockDeducted: order.stockDeducted,
                    paidAt: order.paidAt || null,
                    createdAt: order.createdAt,
                    customerEmail: order.customer.email
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createOrder, getPaymentStatus };
