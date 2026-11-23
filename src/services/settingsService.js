const Settings = require('../models/Settings');
const { encrypt, decrypt } = require('../utilities/encryption');

const SETTINGS_KEY = 'store';
const SECRET_FIELDS = '+stripeSecretKey +stripeWebhookSecret +smtpPassword';

const ensureSettings = async () => {
    let settings = await Settings.findOne({ key: SETTINGS_KEY }).select(SECRET_FIELDS);

    if (!settings) {
        await Settings.create({ key: SETTINGS_KEY });
        settings = await Settings.findOne({ key: SETTINGS_KEY }).select(SECRET_FIELDS);
    }

    return settings;
};

const toPublicSettings = (settings) => ({
    autoApproveOrders: settings.autoApproveOrders,
    storefrontUrl: settings.storefrontUrl,
    currency: settings.currency,
    stripeSecretKeyConfigured: Boolean(settings.stripeSecretKey),
    stripeWebhookSecretConfigured: Boolean(settings.stripeWebhookSecret),
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpSecure: settings.smtpSecure,
    smtpUser: settings.smtpUser,
    smtpPasswordConfigured: Boolean(settings.smtpPassword),
    smtpFromName: settings.smtpFromName,
    smtpFromEmail: settings.smtpFromEmail,
    updatedAt: settings.updatedAt
});

const getPublicSettings = async () => {
    const settings = await ensureSettings();
    return toPublicSettings(settings);
};

const getRuntimeSettings = async () => {
    const settings = await ensureSettings();

    return {
        ...settings.toObject(),
        stripeSecretKey: decrypt(settings.stripeSecretKey),
        stripeWebhookSecret: decrypt(settings.stripeWebhookSecret),
        smtpPassword: decrypt(settings.smtpPassword)
    };
};

const updateSettings = async (payload) => {
    const settings = await ensureSettings();

    const simpleFields = [
        'smtpHost',
        'smtpUser',
        'smtpFromName',
        'smtpFromEmail'
    ];

    for (const field of simpleFields) {
        if (payload[field] !== undefined) {
            settings[field] = payload[field];
        }
    }

    if (payload.autoApproveOrders !== undefined) {
        settings.autoApproveOrders = payload.autoApproveOrders;
    }

    if (payload.storefrontUrl !== undefined) {
        settings.storefrontUrl = payload.storefrontUrl.replace(/\/+$/, '');
    }

    if (payload.currency !== undefined) {
        settings.currency = payload.currency.toLowerCase();
    }

    if (payload.smtpPort !== undefined) {
        settings.smtpPort = Number(payload.smtpPort);
    }

    if (payload.smtpSecure !== undefined) {
        settings.smtpSecure = payload.smtpSecure;
    }

    if (payload.clearStripeSecretKey) {
        settings.stripeSecretKey = '';
    } else if (
        typeof payload.stripeSecretKey === 'string' &&
        payload.stripeSecretKey.trim()
    ) {
        settings.stripeSecretKey = encrypt(payload.stripeSecretKey.trim());
    }

    if (payload.clearStripeWebhookSecret) {
        settings.stripeWebhookSecret = '';
    } else if (
        typeof payload.stripeWebhookSecret === 'string' &&
        payload.stripeWebhookSecret.trim()
    ) {
        settings.stripeWebhookSecret = encrypt(payload.stripeWebhookSecret.trim());
    }

    if (payload.clearSmtpPassword) {
        settings.smtpPassword = '';
    } else if (
        typeof payload.smtpPassword === 'string' &&
        payload.smtpPassword.trim()
    ) {
        settings.smtpPassword = encrypt(payload.smtpPassword.trim());
    }

    await settings.save();

    return toPublicSettings(settings);
};

module.exports = {
    getPublicSettings,
    getRuntimeSettings,
    updateSettings
};
