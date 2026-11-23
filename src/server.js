const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');
const emailTemplateService = require('./services/emailTemplateService');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
    try {
        await emailTemplateService.ensureDefaultTemplate();
    } catch (error) {
        console.warn(
            `Could not ensure the default email template: ${error.message}`
        );
    }

    app.listen(PORT, () => {
        console.log(`Server is running smoothly on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
});