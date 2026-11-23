const Category = require('../models/Category');
const Item = require('../models/Item');
const ApiError = require('../utilities/ApiError');

const listCategories = () => {
    return Category.find()
        .select('name description')
        .sort({ name: 1 })
        .lean();
};

const ensureUniqueName = async (name, excludeId) => {
    const query = { name };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const existingCategory = await Category.findOne(query).select('_id').lean();

    if (existingCategory) {
        throw new ApiError(409, 'Category name already exists');
    }
};

const createCategory = async ({ name, description }) => {
    await ensureUniqueName(name);

    return Category.create({
        name,
        description: description || ''
    });
};

const updateCategory = async (categoryId, { name, description }) => {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    if (name !== undefined) {
        await ensureUniqueName(name, categoryId);
        category.name = name;
    }

    if (description !== undefined) {
        category.description = description;
    }

    await category.save();

    return category;
};

const deleteCategory = async (categoryId) => {
    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    // Items are kept; only the deleted category reference is removed.
    await Item.updateMany(
        { categories: categoryId },
        { $pull: { categories: categoryId } }
    );

    await category.deleteOne();

    return category;
};

module.exports = {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
