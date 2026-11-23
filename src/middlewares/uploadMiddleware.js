const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const ApiError = require('../utilities/ApiError');
const { ITEMS_UPLOADS_DIR } = require('../utilities/fileUtils');

fs.mkdirSync(ITEMS_UPLOADS_DIR, { recursive: true });

const ALLOWED_IMAGE_TYPES = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp']
]);

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, ITEMS_UPLOADS_DIR);
    },
    filename: (req, file, callback) => {
        const extension = ALLOWED_IMAGE_TYPES.get(file.mimetype);
        const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
        callback(null, filename);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            return callback(new ApiError(400, 'Only JPG, PNG, and WEBP images are allowed'));
        }

        callback(null, true);
    }
});

const uploadItemImage = (req, res, next) => {
    upload.single('image')(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return next(new ApiError(400, 'Image size must not exceed 5MB'));
            }

            return next(new ApiError(400, error.message));
        }

        return next(error);
    });
};

module.exports = { uploadItemImage };
