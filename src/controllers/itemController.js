const itemService = require('../services/itemService');

const listItems = async (req, res, next) => {
    try {
        const items = await itemService.listAvailableItems();

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
        const item = await itemService.getPublicItemById(req.params.id);

        res.status(200).json({
            success: true,
            data: { item }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { listItems, getItem };
