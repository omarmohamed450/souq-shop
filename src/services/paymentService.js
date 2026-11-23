const Stripe = require('stripe');
const ApiError = require('../utilities/ApiError');
const orderService = require('./orderService');
const settingsService = require('./settingsService');
const mailService = require('./mailService');

let stripeClientFactory = (secretKey) => new Stripe(secretKey);

const setStripeClientFactoryForTests = (factory) => {
    stripeClientFactory = factory;
};

const resetStripeClientFactoryForTests = () => {
    stripeClientFactory = (secretKey) => new Stripe(secretKey);
};

const getStripeContext = async () => {
    const settings = await settingsService.getRuntimeSettings();

    if (!settings.stripeSecretKey) {
        throw new ApiError(
            503,
            'Stripe is not configured. Add the Stripe secret key in manager settings.'
        );
    }

    return {
        stripe: stripeClientFactory(settings.stripeSecretKey),
        settings
    };
};

const createCheckoutSession = async (order) => {
    if (!order.totalPrice || Number(order.totalPrice) <= 0) {
        throw new ApiError(
            400,
            'Order total must be greater than zero for online payment'
        );
    }

    const { stripe, settings } = await getStripeContext();
    const baseUrl = settings.storefrontUrl.replace(/\/+$/, '');

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: order.customer.email || undefined,
        client_reference_id: order._id.toString(),
        metadata: {
            orderId: order._id.toString(),
            referenceNumber: order.referenceNumber
        },
        payment_intent_data: {
            metadata: {
                orderId: order._id.toString()
            }
        },
        line_items: order.items.map((item) => ({
            quantity: item.quantity,
            price_data: {
                currency: settings.currency || 'egp',
                unit_amount: Math.round(item.price * 100),
                product_data: {
                    name: item.name
                }
            }
        })),
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
        cancel_url: `${baseUrl}/checkout/cancel?order_id=${order._id}`
    });

    if (!session.url) {
        throw new ApiError(502, 'Stripe did not return a checkout URL');
    }

    await orderService.attachStripeSession(order._id, session.id);

    return session;
};

const constructWebhookEvent = async (rawBody, signature) => {
    const settings = await settingsService.getRuntimeSettings();

    if (!settings.stripeWebhookSecret) {
        throw new ApiError(
            503,
            'Stripe webhook secret is not configured in manager settings.'
        );
    }

    if (!signature) {
        throw new ApiError(400, 'Missing Stripe signature header');
    }

    try {
        return Stripe.webhooks.constructEvent(
            rawBody,
            signature,
            settings.stripeWebhookSecret
        );
    } catch (error) {
        throw new ApiError(400, `Invalid Stripe webhook signature: ${error.message}`);
    }
};

const getOrderIdFromSession = (session) =>
    session?.metadata?.orderId || session?.client_reference_id || '';

const getPaymentIntentId = (session) => {
    if (!session?.payment_intent) return '';
    return typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id || '';
};

const handlePaidOrder = async (orderId) => {
    const settings = await settingsService.getRuntimeSettings();
    let order = await orderService.getOrderById(orderId);

    if (
        settings.autoApproveOrders &&
        order.approvalStatus === 'pending' &&
        !order.stockDeducted
    ) {
        try {
            order = await orderService.approveOrder(orderId);
        } catch (error) {
            await orderService.setApprovalError(orderId, error.message);
            order = await orderService.getOrderById(orderId);
        }
    }

    if (order.paymentStatus === 'paid' && !order.confirmationEmailSentAt) {
        try {
            const result = await mailService.sendOrderConfirmation(order);

            if (result.sent) {
                await orderService.markConfirmationEmailSent(orderId);
            } else {
                await orderService.setConfirmationEmailError(
                    orderId,
                    result.reason || 'Confirmation email was not sent'
                );
            }
        } catch (error) {
            await orderService.setConfirmationEmailError(orderId, error.message);
        }
    }
};

const handleCheckoutPaid = async (session) => {
    const orderId = getOrderIdFromSession(session);

    if (!orderId) {
        return;
    }

    await orderService.markPaymentPaid(orderId, {
        sessionId: session.id,
        paymentIntentId: getPaymentIntentId(session)
    });
    await handlePaidOrder(orderId);
};

const handleWebhookEvent = async (event) => {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;

            if (session.payment_status === 'paid') {
                await handleCheckoutPaid(session);
            } else {
                const orderId = getOrderIdFromSession(session);
                if (orderId) {
                    await orderService.attachStripeSession(orderId, session.id);
                }
            }
            break;
        }
        case 'checkout.session.async_payment_succeeded': {
            await handleCheckoutPaid(event.data.object);
            break;
        }
        case 'checkout.session.async_payment_failed': {
            const session = event.data.object;
            const orderId = getOrderIdFromSession(session);

            if (orderId) {
                await orderService.markPaymentFailed(
                    orderId,
                    'Asynchronous Stripe payment failed'
                );
            }
            break;
        }
        case 'checkout.session.expired': {
            const session = event.data.object;
            const orderId = getOrderIdFromSession(session);

            if (orderId) {
                await orderService.markPaymentFailed(
                    orderId,
                    'Stripe checkout session expired'
                );
            }
            break;
        }
        default:
            break;
    }

    return { handled: true };
};

module.exports = {
    createCheckoutSession,
    constructWebhookEvent,
    handleWebhookEvent,
    setStripeClientFactoryForTests,
    resetStripeClientFactoryForTests
};
