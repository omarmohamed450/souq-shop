const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const emailTemplateService = require('../src/services/emailTemplateService');

const seedEmailTemplates = async () => {
    await connectDB();

    const template = await emailTemplateService.ensureDefaultTemplate();

    console.log(
        `Default "${template.key}" email template is ready (id: ${template._id}).`
    );

    await mongoose.disconnect();
};

seedEmailTemplates().catch(async (error) => {
    console.error(`Failed to seed email templates: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
});
