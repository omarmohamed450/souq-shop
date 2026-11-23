const jwt = require('jsonwebtoken');
const ApiError = require('./ApiError');

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new ApiError(500, 'JWT secret is not configured');
    }

    return jwt.sign(
        {
            id: user._id.toString(),
            username: user.username,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired token');
    }
};

module.exports = { generateToken, verifyToken };
