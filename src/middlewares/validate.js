const { validationResult } = require('express-validator');
const { deleteFileByPath } = require('../utilities/fileUtils');

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    if (req.file && req.file.path) {
        deleteFileByPath(req.file.path).catch(() => {});
    }

    return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(({ path, msg }) => ({
            field: path,
            message: msg
        }))
    });
};

module.exports = validate;
