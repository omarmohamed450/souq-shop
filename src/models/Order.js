const mongoose = require('mongoose');

const orderedItemSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: 'Ordered item quantity must be an integer'
            }
        }
    },
    { _id: false }
);

const managerNoteSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Manager note text is required'],
            trim: true,
            maxlength: [1000, 'Manager note must be at most 1000 characters']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: true }
);


const orderSchema = new mongoose.Schema(
    {
        referenceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        customer: {
            name: {
                type: String,
                required: [true, 'Customer name is required'],
                trim: true,
                maxlength: [120, 'Customer name must be at most 120 characters']
            },
            phone: {
                type: String,
                required: [true, 'Customer phone is required'],
                trim: true,
                maxlength: [30, 'Customer phone must be at most 30 characters']
            },
            address: {
                type: String,
                required: [true, 'Customer address is required'],
                trim: true,
                maxlength: [500, 'Customer address must be at most 500 characters']
            },
            email: {
                type: String,
                trim: true,
                lowercase: true,
                maxlength: [120, 'Customer email must be at most 120 characters'],
                default: ''
            }
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Order notes must be at most 1000 characters'],
            default: ''
        },
        managerNotes: {
            type: [managerNoteSchema],
            default: []
        },
        paymentStatus: {
            type: String,
            enum: {
                values: ['pending', 'paid', 'failed'],
                message: 'Payment status must be pending, paid, or failed'
            },
            default: 'pending'
        },
        stripeSessionId: {
            type: String,
            trim: true,
            default: ''
        },
        stripePaymentIntentId: {
            type: String,
            trim: true,
            default: ''
        },
        paidAt: {
            type: Date
        },
        paymentFailedAt: {
            type: Date
        },
        paymentFailureReason: {
            type: String,
            trim: true,
            default: ''
        },
        approvalStatus: {
            type: String,
            enum: {
                values: ['pending', 'approved', 'rejected'],
                message: 'Approval status must be pending, approved, or rejected'
            },
            default: 'pending'
        },
        stockDeducted: {
            type: Boolean,
            default: false
        },
        approvedAt: {
            type: Date
        },
        rejectedAt: {
            type: Date
        },
        approvalError: {
            type: String,
            trim: true,
            default: ''
        },
        confirmationEmailSentAt: {
            type: Date
        },
        confirmationEmailError: {
            type: String,
            trim: true,
            default: ''
        },
        items: {
            type: [orderedItemSchema],
            validate: {
                validator: (value) => Array.isArray(value) && value.length > 0,
                message: 'Order must contain at least one item'
            }
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: {
                values: ['opened', 'in-transit', 'closed'],
                message: 'Order status must be opened, in-transit, or closed'
            },
            default: 'opened'
        }
    },
    { timestamps: true }
);

orderSchema.index({ paymentStatus: 1, approvalStatus: 1 });
orderSchema.index({ 'customer.email': 1 });

orderSchema.statics.formatReferenceNumber = (sequence, date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `#${sequence}-${year}${month}${day}`;
};

orderSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Order', orderSchema);
