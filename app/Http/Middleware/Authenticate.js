const jwt = require('jsonwebtoken');
const authConfig = require('../../../config/auth');
const User = require('../../Models/User');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }

  try {
    const payload = jwt.verify(token, authConfig.jwt.secret);
    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
