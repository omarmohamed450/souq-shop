const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,
            trim: true,
            minlength: [2, 'Category name must be at least 2 characters'],
            maxlength: [80, 'Category name must be at most 80 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Category description must be at most 500 characters'],
            default: ''
        }
    },
    { timestamps: true }
);

categorySchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Category', categorySchema);
