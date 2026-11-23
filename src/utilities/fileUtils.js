const fs = require('fs/promises');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const ITEMS_UPLOADS_DIR = path.join(UPLOADS_ROOT, 'items');
const ITEM_IMAGE_URL_PREFIX = '/uploads/items/';

const deleteFileByPath = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

const deleteItemImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith(ITEM_IMAGE_URL_PREFIX)) return;

    const filename = path.basename(imageUrl);
    await deleteFileByPath(path.join(ITEMS_UPLOADS_DIR, filename));
};

module.exports = {
    UPLOADS_ROOT,
    ITEMS_UPLOADS_DIR,
    ITEM_IMAGE_URL_PREFIX,
    deleteFileByPath,
    deleteItemImage
};
