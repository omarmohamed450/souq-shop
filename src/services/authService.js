const User = require('../models/User');
const ApiError = require('../utilities/ApiError');
const { generateToken } = require('../utilities/tokenUtils');

const login = async ({ username, password }) => {
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const user = await User.findOne({ username: normalizedUsername }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError(401, 'Invalid username or password');
    }

    const token = generateToken(user);

    return { user, token };
};

const getProfile = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
        throw new ApiError(400, 'Current password is incorrect');
    }

    if (currentPassword === newPassword) {
        throw new ApiError(400, 'New password must be different from the current password');
    }

    user.password = newPassword;
    await user.save();

    return user;
};

module.exports = { login, getProfile, changePassword };
