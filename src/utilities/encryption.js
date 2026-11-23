const crypto = require('crypto');

const getKey = () =>
    crypto
        .createHash('sha256')
        .update(
            process.env.SETTINGS_ENCRYPTION_KEY ||
                process.env.JWT_SECRET ||
                'development-settings-key'
        )
        .digest();

const encrypt = (value) => {
    if (!value) return '';

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(String(value), 'utf8'),
        cipher.final()
    ]);

    return [
        iv.toString('base64'),
        cipher.getAuthTag().toString('base64'),
        encrypted.toString('base64')
    ].join('.');
};

const decrypt = (value) => {
    if (!value) return '';

    const parts = String(value).split('.');

    if (parts.length !== 3) {
        return String(value);
    }

    try {
        const [iv, tag, encrypted] = parts;
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            getKey(),
            Buffer.from(iv, 'base64')
        );
        decipher.setAuthTag(Buffer.from(tag, 'base64'));

        return Buffer.concat([
            decipher.update(Buffer.from(encrypted, 'base64')),
            decipher.final()
        ]).toString('utf8');
    } catch (error) {
        return '';
    }
};

module.exports = { encrypt, decrypt };
