const categoryService = require('../services/categoryService');

const listCategories = async (req, res, next) => {
    try {
        const categories = await categoryService.listCategories();

        res.status(200).json({
            success: true,
            data: { categories }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { listCategories };
