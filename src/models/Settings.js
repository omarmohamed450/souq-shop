const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: 'store'
        },
        autoApproveOrders: {
            type: Boolean,
            default: false
        },
        storefrontUrl: {
            type: String,
            trim: true,
            default: 'http://localhost:4200'
        },
        currency: {
            type: String,
            trim: true,
            lowercase: true,
            default: 'egp',
            maxlength: 3
        },
        stripeSecretKey: {
            type: String,
            default: '',
            select: false
        },
        stripeWebhookSecret: {
            type: String,
            default: '',
            select: false
        },
        smtpHost: {
            type: String,
            trim: true,
            default: ''
        },
        smtpPort: {
            type: Number,
            default: 587,
            min: 1,
            max: 65535
        },
        smtpSecure: {
            type: Boolean,
            default: false
        },
        smtpUser: {
            type: String,
            trim: true,
            default: ''
        },
        smtpPassword: {
            type: String,
            default: '',
            select: false
        },
        smtpFromName: {
            type: String,
            trim: true,
            default: 'Souq Online Store'
        },
        smtpFromEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: ''
        }
    },
    { timestamps: true }
);

settingsSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        delete ret.stripeSecretKey;
        delete ret.stripeWebhookSecret;
        delete ret.smtpPassword;
        return ret;
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
