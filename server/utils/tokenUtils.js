const jwt = require('jsonwebtoken');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Fail fast when token helpers are used without required secret config.
function ensureJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }
}

// Auth token carries identity + role claims used by route guards.
function signAuthToken(user) {
  ensureJwtSecret();
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Standard JWT verify wrapper for request authentication.
function verifyAuthToken(token) {
  ensureJwtSecret();
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Email tokens are short-lived and used for verification/reset flows.
function signEmailToken(payload, expiresIn = '24h') {
  ensureJwtSecret();
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

// Shared verifier for verification and password reset links.
function verifyEmailToken(token) {
  ensureJwtSecret();
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
  signEmailToken,
  verifyEmailToken,
};
