const Category = require('../models/Category');
const Item = require('../models/Item');
const ApiError = require('../utilities/ApiError');
const { deleteItemImage } = require('../utilities/fileUtils');

const toPublicItem = (item) => ({
    _id: item._id,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    categories: item.categories,
    isAvailable: item.quantity > 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
});

const normalizeCategories = (categories) => {
    return [...new Set((categories || []).map((categoryId) => String(categoryId)))];
};

const ensureCategoriesExist = async (categories) => {
    if (!categories.length) {
        throw new ApiError(400, 'Item must belong to at least one category');
    }

    const existingCategoriesCount = await Category.countDocuments({
        _id: { $in: categories }
    });

    if (existingCategoriesCount !== categories.length) {
        throw new ApiError(400, 'One or more categories do not exist');
    }
};

const listAvailableItems = async () => {
    const items = await Item.find({ isHidden: false, quantity: { $gt: 0 } })
        .select('name description price imageUrl categories quantity createdAt updatedAt')
        .populate('categories', 'name')
        .sort({ createdAt: -1 })
        .lean();

    return items.map(toPublicItem);
};

const getPublicItemById = async (itemId) => {
    const item = await Item.findOne({ _id: itemId, isHidden: false })
        .select('name description price imageUrl categories quantity createdAt updatedAt')
        .populate('categories', 'name')
        .lean();

    if (!item) {
        throw new ApiError(404, 'Item not found');
    }

    return toPublicItem(item);
};

const listItemsForManager = () => {
    return Item.find()
        .select('-__v')
        .populate('categories', 'name')
        .sort({ createdAt: -1 })
        .lean();
};

const getItemForManager = async (itemId) => {
    const item = await Item.findById(itemId)
        .select('-__v')
        .populate('categories', 'name')
        .lean();

    if (!item) {
        throw new ApiError(404, 'Item not found');
    }

    return item;
};

const createItem = async (data) => {
    const categories = normalizeCategories(data.categories);
    await ensureCategoriesExist(categories);

    return Item.create({
        name: data.name,
        description: data.description || '',
        price: data.price,
        quantity: data.quantity,
        imageUrl: data.imageUrl || '',
        isHidden: data.isHidden ?? false,
        categories
    });
};

const updateItem = async (itemId, data) => {
    const item = await Item.findById(itemId);

    if (!item) {
        throw new ApiError(404, 'Item not found');
    }

    if (data.categories !== undefined) {
        const categories = normalizeCategories(data.categories);
        await ensureCategoriesExist(categories);
        item.categories = categories;
    }

    const fields = ['name', 'description', 'price', 'quantity', 'isHidden'];

    for (const field of fields) {
        if (data[field] !== undefined) {
            item[field] = data[field];
        }
    }

    const previousImageUrl = item.imageUrl;

    if (data.imageUrl !== undefined) {
        item.imageUrl = data.imageUrl;
    }

    await item.save();

    if (previousImageUrl && previousImageUrl !== item.imageUrl) {
        try {
            await deleteItemImage(previousImageUrl);
        } catch (error) {
            console.error(`Failed to delete previous item image: ${error.message}`);
        }
    }

    return item;
};

const deleteItem = async (itemId) => {
    const item = await Item.findByIdAndDelete(itemId);

    if (!item) {
        throw new ApiError(404, 'Item not found');
    }

    try {
        await deleteItemImage(item.imageUrl);
    } catch (error) {
        console.error(`Failed to delete item image: ${error.message}`);
    }

    return item;
};

module.exports = {
    listAvailableItems,
    getPublicItemById,
    listItemsForManager,
    getItemForManager,
    createItem,
    updateItem,
    deleteItem
};
