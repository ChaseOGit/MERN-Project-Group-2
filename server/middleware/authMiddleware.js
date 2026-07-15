const User = require('../models/users');
const { verifyAuthToken } = require('../utils/tokenUtils');

// Validates bearer token and attaches a lightweight user snapshot to req.user.
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    req.user = {
      _id: user._id,
      role: user.role,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Restricts endpoints to specific roles (ex: Admin-only operations).
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission for this action' });
    }

    return next();
  };
}

// Blocks access until the account has passed email verification.
function requireVerifiedEmail(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({ message: 'Email verification required' });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireRole,
  requireVerifiedEmail,
};
