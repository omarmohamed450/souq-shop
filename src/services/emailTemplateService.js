const EmailTemplate = require('../models/EmailTemplate');
const ApiError = require('../utilities/ApiError');

const ORDER_CONFIRMATION_KEY = 'order_confirmation';

const DEFAULT_ORDER_CONFIRMATION = {
    key: ORDER_CONFIRMATION_KEY,
    name: 'Order confirmation',
    description: 'Sent automatically after a successful online payment.',
    subject: 'Order confirmation {{order_reference}}',
    body: [
        'Hello {{customer_name}},',
        '',
        'Thank you for your order {{order_reference}}.',
        '',
        'Total: {{total_amount}}',
        'Payment status: {{payment_status}}',
        'Order status: {{order_status}}',
        '',
        'Items:',
        '{{order_items}}',
        '',
        'Delivery address:',
        '{{customer_address}}',
        '',
        'We will contact you soon.'
    ].join('\n'),
    isSystem: true
};

const PLACEHOLDERS = [
    'customer_name',
    'customer_email',
    'customer_phone',
    'customer_address',
    'order_id',
    'order_reference',
    'order_date',
    'order_status',
    'payment_status',
    'approval_status',
    'total_amount',
    'order_items',
    'order_notes'
];

const ensureDefaultTemplate = async () => {
    let template = await EmailTemplate.findOne({ key: ORDER_CONFIRMATION_KEY });

    if (!template) {
        template = await EmailTemplate.create(DEFAULT_ORDER_CONFIRMATION);
    }

    return template;
};

const listTemplates = () => {
    return EmailTemplate.find()
        .select('-__v')
        .sort({ isSystem: -1, name: 1 })
        .lean();
};

const getTemplateById = async (templateId) => {
    const template = await EmailTemplate.findById(templateId).select('-__v').lean();

    if (!template) {
        throw new ApiError(404, 'Email template not found');
    }

    return template;
};

const createTemplate = async (payload) => {
    try {
        return await EmailTemplate.create({
            key: payload.key,
            name: payload.name,
            subject: payload.subject,
            body: payload.body,
            description: payload.description || '',
            isSystem: false
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(409, 'An email template with this key already exists');
        }
        throw error;
    }
};

const updateTemplate = async (templateId, payload) => {
    try {
        const template = await EmailTemplate.findByIdAndUpdate(
            templateId,
            payload,
            { new: true, runValidators: true }
        ).select('-__v');

        if (!template) {
            throw new ApiError(404, 'Email template not found');
        }

        return template;
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(409, 'An email template with this key already exists');
        }
        throw error;
    }
};

const deleteTemplate = async (templateId) => {
    const template = await EmailTemplate.findByIdAndDelete(templateId);

    if (!template) {
        throw new ApiError(404, 'Email template not found');
    }
};

const getOrderConfirmationTemplate = async () => {
    await ensureDefaultTemplate();
    const template = await EmailTemplate.findOne({ key: ORDER_CONFIRMATION_KEY }).lean();

    return template || DEFAULT_ORDER_CONFIRMATION;
};

module.exports = {
    ORDER_CONFIRMATION_KEY,
    DEFAULT_ORDER_CONFIRMATION,
    PLACEHOLDERS,
    ensureDefaultTemplate,
    listTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getOrderConfirmationTemplate
};
