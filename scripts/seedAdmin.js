const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const seedAdmin = async () => {
    await connectDB();

    const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'password';

    const existingManager = await User.findOne({ username });

    if (existingManager) {
        console.log(`Manager "${username}" already exists. No changes made.`);
    } else {
        await User.create({ username, password, role: 'manager' });
        console.log(`Manager "${username}" created successfully.`);
    }

    await mongoose.disconnect();
};

seedAdmin().catch(async (error) => {
    console.error(`Failed to seed manager: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
});
