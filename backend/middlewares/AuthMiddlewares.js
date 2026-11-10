


const {verify} = require('jsonwebtoken');

const validateToken = (req, res, next) => {
    const accessToken = req.header('accessToken');

    if (!accessToken) return res.status(401).json({ error: 'User not authenticated' });

    try {
        const validToken = verify(accessToken, "importantsecret");
        const userId = validToken.userId; // Extract userId from the token
        if (validToken) {
            req.user = { user_ID: userId }; // Attach userId to the request object
            return next();
        }
    } catch (error) {
        return res.status(403).json({ error: error.message });
    }
}

module.exports = { validateToken };