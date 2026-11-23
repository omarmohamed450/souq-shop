const orderService = require('../services/orderService');

const listOrders = async (req, res, next) => {
    try {
        const orders = await orderService.listOrders();

        res.status(200).json({
            success: true,
            data: { orders }
        });
    } catch (error) {
        next(error);
    }
};

const getOrder = async (req, res, next) => {
    try {
        const order = await orderService.getOrderById(req.params.id);

        res.status(200).json({
            success: true,
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const order = await orderService.updateOrderStatus(req.params.id, req.body.status);

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

const addOrderNote = async (req, res, next) => {
    try {
        const order = await orderService.addOrderNote(req.params.id, req.body.text);

        res.status(201).json({
            success: true,
            message: 'Order note added successfully',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

const approveOrder = async (req, res, next) => {
    try {
        const order = await orderService.approveOrder(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Order approved and stock deducted successfully',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

const rejectOrder = async (req, res, next) => {
    try {
        const order = await orderService.rejectOrder(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Order rejected successfully',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};

const listCustomers = async (req, res, next) => {
    try {
        const customers = await orderService.listCustomers();

        res.status(200).json({
            success: true,
            data: { customers }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listOrders,
    getOrder,
    updateOrderStatus,
    addOrderNote,
    approveOrder,
    rejectOrder,
    listCustomers
};
