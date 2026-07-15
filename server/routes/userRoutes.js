const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  startGoogleOAuth,
  googleCallback,
} = require('../controllers/userController');
const {
  requireAuth,
  requireVerifiedEmail,
} = require('../middleware/authMiddleware');

// Local auth and account lifecycle endpoints.
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth entry and callback.
router.get('/oauth/google', startGoogleOAuth);
router.get('/oauth/google/callback', googleCallback);

// Authenticated profile endpoints.
router.get('/me', requireAuth, getMe);
// Profile-by-id stays verified-only to avoid exposing unverified accounts.
router.get('/:id', requireAuth, requireVerifiedEmail, getProfile);

module.exports = router;
