const authService = require('../services/authService');

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const { user, token } = await authService.login({ username, password });

        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            data: { token, user }
        });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const user = await authService.getProfile(req.user._id);

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user._id, currentPassword, newPassword);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { login, getProfile, changePassword };
