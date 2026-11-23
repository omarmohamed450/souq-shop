const Item = require('../models/Item');
const Order = require('../models/Order');
const Counter = require('../models/Counter');
const ApiError = require('../utilities/ApiError');

const STARTING_SEQUENCE = 1000;

const mergeOrderItems = (items) => {
    const mergedItems = new Map();

    for (const { itemId, quantity } of items) {
        mergedItems.set(itemId, (mergedItems.get(itemId) || 0) + quantity);
    }

    return mergedItems;
};

const rollbackStock = async (decrementedItems) => {
    await Promise.all(
        decrementedItems.map(({ itemId, quantity }) =>
            Item.updateOne({ _id: itemId }, { $inc: { quantity } })
        )
    );
};

const normalizeOrder = (order) => {
    if (!order) return order;

    const hasStockDeductedField = order.stockDeducted !== undefined;

    return {
        ...order,
        customer: {
            ...(order.customer || {}),
            email: order.customer?.email || ''
        },
        managerNotes: order.managerNotes || [],
        paymentStatus: order.paymentStatus || 'pending',
        approvalStatus:
            order.approvalStatus ||
            (hasStockDeductedField
                ? order.stockDeducted
                    ? 'approved'
                    : 'pending'
                : 'approved'),
        stockDeducted: hasStockDeductedField ? order.stockDeducted : true,
        stripeSessionId: order.stripeSessionId || '',
        stripePaymentIntentId: order.stripePaymentIntentId || '',
        paymentFailureReason: order.paymentFailureReason || '',
        approvalError: order.approvalError || '',
        confirmationEmailError: order.confirmationEmailError || ''
    };
};

const validateOrderItems = async (mergedItems) => {
    const orderItems = [];

    for (const [itemId, quantity] of mergedItems.entries()) {
        const item = await Item.findById(itemId).select(
            'name price quantity isHidden'
        );

        if (!item) {
            throw new ApiError(404, `Item not found: ${itemId}`);
        }

        if (item.isHidden) {
            throw new ApiError(400, `Item "${item.name}" is not available`);
        }

        if (item.quantity < quantity) {
            throw new ApiError(
                400,
                `Item "${item.name}" does not have enough stock. Available quantity: ${item.quantity}`
            );
        }

        orderItems.push({
            item: item._id,
            name: item.name,
            price: item.price,
            quantity
        });
    }

    return orderItems;
};

const deductStock = async (orderItems) => {
    const decrementedItems = [];

    try {
        for (const line of orderItems) {
            const item = await Item.findOneAndUpdate(
                {
                    _id: line.item,
                    isHidden: false,
                    quantity: { $gte: line.quantity }
                },
                { $inc: { quantity: -line.quantity } },
                { new: true }
            ).select('name quantity');

            if (!item) {
                const existingItem = await Item.findById(line.item).select(
                    'name quantity isHidden'
                );

                if (!existingItem) {
                    throw new ApiError(404, `Item not found: ${line.name}`);
                }

                if (existingItem.isHidden) {
                    throw new ApiError(
                        400,
                        `Item "${existingItem.name}" is not available`
                    );
                }

                throw new ApiError(
                    400,
                    `Item "${existingItem.name}" does not have enough stock. Available quantity: ${existingItem.quantity}`
                );
            }

            decrementedItems.push({
                itemId: line.item,
                quantity: line.quantity
            });
        }
    } catch (error) {
        if (decrementedItems.length > 0) {
            try {
                await rollbackStock(decrementedItems);
            } catch (rollbackError) {
                console.error(
                    `Failed to rollback item stock: ${rollbackError.message}`
                );
            }
        }

        throw error;
    }
};

const createOrder = async ({ customer, notes, items }) => {
    const mergedItems = mergeOrderItems(items);
    const orderItems = await validateOrderItems(mergedItems);

    const counter = await Counter.findByIdAndUpdate(
        'order',
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const referenceNumber = Order.formatReferenceNumber(
        STARTING_SEQUENCE + counter.sequence
    );
    const totalPrice =
        Math.round(
            orderItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            ) * 100
        ) / 100;

    return Order.create({
        referenceNumber,
        customer,
        notes: notes || '',
        items: orderItems,
        totalPrice,
        paymentStatus: 'pending',
        approvalStatus: 'pending',
        stockDeducted: false
    });
};

const listOrders = async () => {
    const orders = await Order.find()
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean();

    return orders.map(normalizeOrder);
};

const getOrderById = async (orderId) => {
    const order = await Order.findById(orderId).select('-__v').lean();

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return normalizeOrder(order);
};

const updateOrderStatus = async (orderId, status) => {
    const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true, runValidators: true }
    )
        .select('-__v')
        .lean();

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return normalizeOrder(order);
};

const approveOrder = async (orderId) => {
    const order = await Order.findOneAndUpdate(
        {
            _id: orderId,
            approvalStatus: 'pending',
            stockDeducted: false,
            paymentStatus: 'paid'
        },
        {
            $set: {
                approvalStatus: 'approved',
                approvedAt: new Date(),
                approvalError: ''
            }
        },
        { new: true, runValidators: true }
    )
        .select('-__v')
        .lean();

    if (!order) {
        const existing = await Order.findById(orderId)
            .select('paymentStatus approvalStatus stockDeducted')
            .lean();

        if (!existing) {
            throw new ApiError(404, 'Order not found');
        }

        if (existing.approvalStatus === 'approved' || existing.stockDeducted) {
            return getOrderById(orderId);
        }

        if (existing.approvalStatus === 'rejected') {
            throw new ApiError(400, 'Rejected orders cannot be approved');
        }

        if (existing.paymentStatus !== 'paid') {
            throw new ApiError(400, 'Order payment must be paid before approval');
        }

        throw new ApiError(400, 'Order is not pending approval');
    }

    let stockWasDeducted = false;

    try {
        await deductStock(order.items);
        stockWasDeducted = true;

        await Order.updateOne(
            { _id: orderId },
            { $set: { stockDeducted: true } }
        );
    } catch (error) {
        if (stockWasDeducted) {
            try {
                await rollbackStock(
                    order.items.map((line) => ({
                        itemId: line.item,
                        quantity: line.quantity
                    }))
                );
            } catch (rollbackError) {
                console.error(
                    `Failed to rollback approval stock: ${rollbackError.message}`
                );
            }
        }

        await Order.updateOne(
            { _id: orderId },
            {
                $set: {
                    approvalStatus: 'pending',
                    approvedAt: null,
                    approvalError: error.message
                }
            }
        );

        throw error;
    }

    return getOrderById(orderId);
};

const rejectOrder = async (orderId) => {
    const order = await Order.findOneAndUpdate(
        {
            _id: orderId,
            approvalStatus: 'pending',
            stockDeducted: false
        },
        {
            $set: {
                approvalStatus: 'rejected',
                rejectedAt: new Date(),
                approvalError: ''
            }
        },
        { new: true, runValidators: true }
    )
        .select('-__v')
        .lean();

    if (!order) {
        const existing = await Order.findById(orderId)
            .select('approvalStatus stockDeducted')
            .lean();

        if (!existing) {
            throw new ApiError(404, 'Order not found');
        }

        if (existing.approvalStatus === 'rejected') {
            return getOrderById(orderId);
        }

        if (existing.approvalStatus === 'approved' || existing.stockDeducted) {
            throw new ApiError(400, 'Approved orders cannot be rejected');
        }

        throw new ApiError(400, 'Order is not pending approval');
    }

    return normalizeOrder(order);
};

const attachStripeSession = async (orderId, sessionId) => {
    const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { stripeSessionId: sessionId } },
        { new: true, runValidators: true }
    )
        .select('-__v')
        .lean();

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return normalizeOrder(order);
};

const markPaymentPaid = async (
    orderId,
    { sessionId, paymentIntentId } = {}
) => {
    const update = {
        paymentStatus: 'paid',
        paidAt: new Date(),
        paymentFailureReason: ''
    };

    if (sessionId) update.stripeSessionId = sessionId;
    if (paymentIntentId) update.stripePaymentIntentId = paymentIntentId;

    const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: update },
        { new: true, runValidators: true }
    )
        .select('-__v')
        .lean();

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return normalizeOrder(order);
};

const markPaymentFailed = async (orderId, reason) => {
    const order = await Order.findOneAndUpdate(
        { _id: orderId, paymentStatus: { $ne: 'paid' } },
        {
            $set: {
                paymentStatus: 'failed',
                paymentFailedAt: new Date(),
                paymentFailureReason: reason || 'Payment failed'
            }
        },
        { new: true, runValidators: true }
    )
        .select('-__v')
        .lean();

    if (!order) {
        const existing = await Order.findById(orderId).select('paymentStatus').lean();

        if (!existing) {
            throw new ApiError(404, 'Order not found');
        }

        return getOrderById(orderId);
    }

    return normalizeOrder(order);
};

const setApprovalError = async (orderId, message) => {
    await Order.updateOne(
        { _id: orderId },
        { $set: { approvalError: message || '' } }
    );
};

const markConfirmationEmailSent = async (orderId) => {
    await Order.updateOne(
        { _id: orderId },
        {
            $set: {
                confirmationEmailSentAt: new Date(),
                confirmationEmailError: ''
            }
        }
    );
};

const setConfirmationEmailError = async (orderId, message) => {
    await Order.updateOne(
        { _id: orderId },
        { $set: { confirmationEmailError: message || '' } }
    );
};

const deleteOrder = (orderId) => {
    return Order.findByIdAndDelete(orderId);
};

const listCustomers = async () => {
    const orders = await Order.find({ 'customer.email': { $nin: ['', null] } })
        .select('customer referenceNumber status paymentStatus createdAt')
        .sort({ createdAt: -1 })
        .lean();

    const customers = new Map();

    for (const order of orders) {
        const email = (order.customer?.email || '').toLowerCase();

        if (!email || customers.has(email)) continue;

        customers.set(email, {
            name: order.customer.name,
            email: order.customer.email,
            phone: order.customer.phone,
            orderId: order._id,
            referenceNumber: order.referenceNumber,
            orderStatus: order.status,
            paymentStatus: order.paymentStatus || 'pending',
            lastOrderAt: order.createdAt
        });
    }

    return [...customers.values()];
};

const addOrderNote = async (orderId, text) => {
    const order = await Order.findByIdAndUpdate(
        orderId,
        {
            $push: {
                managerNotes: {
                    text,
                    createdAt: new Date()
                }
            }
        },
        { new: true, runValidators: true }
    )
        .select('-__v')
        .lean();

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return normalizeOrder(order);
};

module.exports = {
    createOrder,
    listOrders,
    getOrderById,
    updateOrderStatus,
    approveOrder,
    rejectOrder,
    attachStripeSession,
    markPaymentPaid,
    markPaymentFailed,
    setApprovalError,
    markConfirmationEmailSent,
    setConfirmationEmailError,
    deleteOrder,
    listCustomers,
    addOrderNote
};
