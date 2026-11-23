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

const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const category = await categoryService.createCategory({ name, description });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category }
        });
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const category = await categoryService.updateCategory(req.params.id, { name, description });

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: { category }
        });
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        await categoryService.deleteCategory(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully. Items were kept and unlinked.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
