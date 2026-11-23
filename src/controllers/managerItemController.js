const itemService = require('../services/itemService');
const { deleteFileByPath, ITEM_IMAGE_URL_PREFIX } = require('../utilities/fileUtils');

const buildItemPayload = (req) => {
    const payload = {};
    const fields = ['name', 'description', 'price', 'quantity', 'categories', 'imageUrl', 'isHidden'];

    for (const field of fields) {
        if (req.body[field] !== undefined) {
            payload[field] = req.body[field];
        }
    }

    if (req.file) {
        payload.imageUrl = `${ITEM_IMAGE_URL_PREFIX}${req.file.filename}`;
    }

    return payload;
};

const cleanupUploadedFile = async (req) => {
    if (!req.file || !req.file.path) return;

    try {
        await deleteFileByPath(req.file.path);
    } catch (error) {
        console.error(`Failed to clean up uploaded file: ${error.message}`);
    }
};

const listItems = async (req, res, next) => {
    try {
        const items = await itemService.listItemsForManager();

        res.status(200).json({
            success: true,
            data: { items }
        });
    } catch (error) {
        next(error);
    }
};

const getItem = async (req, res, next) => {
    try {
        const item = await itemService.getItemForManager(req.params.id);

        res.status(200).json({
            success: true,
            data: { item }
        });
    } catch (error) {
        next(error);
    }
};

const createItem = async (req, res, next) => {
    try {
        const item = await itemService.createItem(buildItemPayload(req));

        res.status(201).json({
            success: true,
            message: 'Item created successfully',
            data: { item }
        });
    } catch (error) {
        await cleanupUploadedFile(req);
        next(error);
    }
};

const updateItem = async (req, res, next) => {
    try {
        const item = await itemService.updateItem(req.params.id, buildItemPayload(req));

        res.status(200).json({
            success: true,
            message: 'Item updated successfully',
            data: { item }
        });
    } catch (error) {
        await cleanupUploadedFile(req);
        next(error);
    }
};

const deleteItem = async (req, res, next) => {
    try {
        await itemService.deleteItem(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { listItems, getItem, createItem, updateItem, deleteItem };
