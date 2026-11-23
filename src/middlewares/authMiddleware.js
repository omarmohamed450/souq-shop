const User = require('../models/User');
const ApiError = require('../utilities/ApiError');
const { verifyToken } = require('../utilities/tokenUtils');

const protect = async (req, res, next) => {
    try {
        const authorizationHeader = req.headers.authorization || '';

        if (!authorizationHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'Authentication required');
        }

        const token = authorizationHeader.slice(7).trim();
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new ApiError(401, 'User no longer exists');
        }

        if (user.role !== 'manager') {
            throw new ApiError(403, 'Access denied');
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { protect };
