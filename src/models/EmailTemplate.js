const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: [true, 'Template key is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[a-z0-9_]+$/,
                'Template key may contain only lowercase letters, numbers, and underscores'
            ]
        },
        name: {
            type: String,
            required: [true, 'Template name is required'],
            trim: true,
            maxlength: [120, 'Template name must be at most 120 characters']
        },
        subject: {
            type: String,
            required: [true, 'Template subject is required'],
            trim: true,
            maxlength: [200, 'Template subject must be at most 200 characters']
        },
        body: {
            type: String,
            required: [true, 'Template body is required'],
            trim: true,
            maxlength: [20000, 'Template body must be at most 20000 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Template description must be at most 500 characters'],
            default: ''
        },
        isSystem: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

emailTemplateSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
