const nodemailer = require('nodemailer');
const settingsService = require('./settingsService');
const emailTemplateService = require('./emailTemplateService');
const ApiError = require('../utilities/ApiError');

let transportOverride = null;

const setTransportForTests = (transport) => {
    transportOverride = transport;
};

const resetTransportForTests = () => {
    transportOverride = null;
};

const STATUS_LABELS = {
    opened: 'Opened',
    'in-transit': 'In transit',
    closed: 'Closed',
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    approved: 'Approved',
    rejected: 'Rejected'
};

const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const formatDate = (value) => {
    if (!value) return '';

    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(value));
};

const buildContext = (order, settings) => {
    if (!order) {
        return {
            customer_name: '',
            customer_email: '',
            customer_phone: '',
            customer_address: '',
            order_id: '',
            order_reference: '',
            order_date: '',
            order_status: '',
            payment_status: '',
            approval_status: '',
            total_amount: '',
            order_items: '',
            order_notes: ''
        };
    }

    const currency = (settings.currency || 'egp').toUpperCase();
    const amount = (value) => `${Number(value || 0).toFixed(2)} ${currency}`;

    return {
        customer_name: order.customer?.name || '',
        customer_email: order.customer?.email || '',
        customer_phone: order.customer?.phone || '',
        customer_address: order.customer?.address || '',
        order_id: order.referenceNumber || order._id || '',
        order_reference: order.referenceNumber || '',
        order_date: formatDate(order.createdAt),
        order_status: STATUS_LABELS[order.status] || order.status || '',
        payment_status: STATUS_LABELS[order.paymentStatus] || order.paymentStatus || '',
        approval_status:
            STATUS_LABELS[order.approvalStatus] || order.approvalStatus || '',
        total_amount: amount(order.totalPrice),
        order_items: (order.items || [])
            .map(
                (item) =>
                    `${item.quantity} x ${item.name} - ${amount(item.price * item.quantity)}`
            )
            .join('\n'),
        order_notes: order.notes || ''
    };
};

const renderPlaceholders = (content, context) => {
    if (!content) return '';

    return String(content).replace(
        /\{\{\s*([a-z0-9_]+)\s*\}\}/gi,
        (match, key) => {
            const normalizedKey = String(key).toLowerCase();
            return Object.prototype.hasOwnProperty.call(context, normalizedKey)
                ? String(context[normalizedKey])
                : match;
        }
    );
};

const createTransporter = (settings) => {
    if (transportOverride) {
        return { transport: transportOverride, mode: 'test' };
    }

    if (settings.smtpHost) {
        return {
            transport: nodemailer.createTransport({
                host: settings.smtpHost,
                port: Number(settings.smtpPort) || 587,
                secure: Boolean(settings.smtpSecure),
                auth:
                    settings.smtpUser && settings.smtpPassword
                        ? {
                              user: settings.smtpUser,
                              pass: settings.smtpPassword
                          }
                        : undefined
            }),
            mode: 'smtp'
        };
    }

    return {
        transport: nodemailer.createTransport({ jsonTransport: true }),
        mode: 'development'
    };
};

const sendEmail = async ({ to, subject, body, order, settings }) => {
    if (!to) {
        throw new ApiError(400, 'Recipient email is required');
    }

    const runtimeSettings = settings || (await settingsService.getRuntimeSettings());
    const context = buildContext(order, runtimeSettings);
    const renderedSubject = renderPlaceholders(subject, context).trim();
    const renderedBody = renderPlaceholders(body, context);
    const fromEmail =
        runtimeSettings.smtpFromEmail || runtimeSettings.smtpUser || 'no-reply@localhost';
    const fromName = runtimeSettings.smtpFromName || 'Souq Online Store';
    const { transport, mode } = createTransporter(runtimeSettings);

    const html = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.7; color: #292524;">${escapeHtml(
        renderedBody
    ).replace(/\n/g, '<br>')}</div>`;

    const info = await transport.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject: renderedSubject,
        text: renderedBody,
        html
    });

    if (mode === 'development') {
        console.log(`[mail:development] ${info.message}`);
    }

    return {
        mode,
        messageId: info.messageId,
        accepted: info.accepted || [],
        rejected: info.rejected || []
    };
};

const sendOrderConfirmation = async (order) => {
    if (!order?.customer?.email) {
        return { sent: false, reason: 'Customer email is missing' };
    }

    const settings = await settingsService.getRuntimeSettings();
    const template = await emailTemplateService.getOrderConfirmationTemplate();
    const result = await sendEmail({
        to: order.customer.email,
        subject: template.subject,
        body: template.body,
        order,
        settings
    });

    return { sent: true, ...result };
};

const sendManualEmail = async ({ to, subject, body, order }) => {
    return sendEmail({ to, subject, body, order });
};

module.exports = {
    renderPlaceholders,
    buildContext,
    sendEmail,
    sendOrderConfirmation,
    sendManualEmail,
    setTransportForTests,
    resetTransportForTests
};
