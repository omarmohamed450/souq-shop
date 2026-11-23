const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Category = require('../src/models/Category');
const Item = require('../src/models/Item');
const User = require('../src/models/User');

const categoriesData = [
    { name: 'Electronics', description: 'Phones, audio devices, and smart gadgets.' },
    { name: 'Fashion', description: 'Clothing, shoes, and everyday accessories.' },
    { name: 'Home & Kitchen', description: 'Useful products for your home and kitchen.' },
    { name: 'Books', description: 'Books for learning and entertainment.' }
];

const itemsData = [
    {
        name: 'Wireless Headphones',
        description: 'Over-ear wireless headphones with noise cancellation and 30 hours of battery life.',
        price: 1200,
        quantity: 15,
        categoryNames: ['Electronics']
    },
    {
        name: 'Smart Watch',
        description: 'Fitness tracking, heart-rate monitoring, and smartphone notifications.',
        price: 2500,
        quantity: 8,
        categoryNames: ['Electronics', 'Fashion']
    },
    {
        name: 'Cotton T-Shirt',
        description: 'Soft 100% cotton t-shirt available in multiple colors.',
        price: 350,
        quantity: 30,
        categoryNames: ['Fashion']
    },
    {
        name: 'Running Shoes',
        description: 'Lightweight running shoes with breathable mesh and cushioned soles.',
        price: 1800,
        quantity: 12,
        categoryNames: ['Fashion']
    },
    {
        name: 'Ceramic Coffee Mug',
        description: 'Microwave-safe ceramic mug with a comfortable handle.',
        price: 150,
        quantity: 50,
        categoryNames: ['Home & Kitchen']
    },
    {
        name: 'Stainless Steel Cookware Set',
        description: 'Durable five-piece cookware set suitable for all stovetops.',
        price: 3200,
        quantity: 5,
        categoryNames: ['Home & Kitchen']
    },
    {
        name: 'The Art of Clean Code',
        description: 'A practical guide to writing readable and maintainable software.',
        price: 450,
        quantity: 20,
        categoryNames: ['Books']
    },
    {
        name: 'Bluetooth Speaker',
        description: 'Portable speaker with rich sound and water-resistant housing.',
        price: 950,
        quantity: 10,
        categoryNames: ['Electronics', 'Home & Kitchen']
    },
    {
        name: 'Vintage Desk Lamp',
        description: 'A decorative desk lamp with a warm light. Currently out of stock.',
        price: 900,
        quantity: 0,
        categoryNames: ['Home & Kitchen']
    },
    {
        name: 'Limited Edition Poster',
        description: 'A hidden demo item used to test the manager visibility toggle.',
        price: 300,
        quantity: 3,
        categoryNames: ['Books'],
        isHidden: true
    }
];

const seedDemoData = async () => {
    await connectDB();

    const managersCount = await User.countDocuments({ role: 'manager' });

    if (managersCount === 0) {
        console.warn('No manager account found. Run "npm run seed" first.');
    }

    const categoryIdsByName = new Map();

    for (const categoryData of categoriesData) {
        let category = await Category.findOne({ name: categoryData.name });

        if (!category) {
            category = await Category.create(categoryData);
            console.log(`Created category: ${category.name}`);
        } else {
            console.log(`Category already exists: ${category.name}`);
        }

        categoryIdsByName.set(category.name, category._id);
    }

    let createdItems = 0;
    let skippedItems = 0;

    for (const itemData of itemsData) {
        const existingItem = await Item.findOne({ name: itemData.name });

        if (existingItem) {
            console.log(`Item already exists: ${itemData.name}`);
            skippedItems += 1;
            continue;
        }

        const categories = itemData.categoryNames
            .map((categoryName) => categoryIdsByName.get(categoryName))
            .filter(Boolean);

        if (categories.length === 0) {
            throw new Error(`No valid categories found for item: ${itemData.name}`);
        }

        await Item.create({
            name: itemData.name,
            description: itemData.description,
            price: itemData.price,
            quantity: itemData.quantity,
            categories,
            isHidden: itemData.isHidden || false
        });

        createdItems += 1;
        console.log(`Created item: ${itemData.name}`);
    }

    console.log(`Demo data seeding finished. Items created: ${createdItems}, skipped: ${skippedItems}.`);

    await mongoose.disconnect();
};

seedDemoData().catch(async (error) => {
    console.error(`Failed to seed demo data: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
});
