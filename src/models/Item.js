const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true,
            minlength: [2, 'Item name must be at least 2 characters'],
            maxlength: [120, 'Item name must be at most 120 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, 'Item description must be at most 2000 characters'],
            default: ''
        },
        price: {
            type: Number,
            required: [true, 'Item price is required'],
            min: [0, 'Item price cannot be negative']
        },
        quantity: {
            type: Number,
            required: [true, 'Item quantity is required'],
            min: [0, 'Item quantity cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: 'Item quantity must be an integer'
            }
        },
        imageUrl: {
            type: String,
            trim: true,
            default: ''
        },
        isHidden: {
            type: Boolean,
            default: false
        },
        categories: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
            default: []
        }
    },
    { timestamps: true }
);

itemSchema.index({ isHidden: 1, quantity: 1 });

itemSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Item', itemSchema);
