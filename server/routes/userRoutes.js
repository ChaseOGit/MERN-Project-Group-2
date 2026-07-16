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
/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', register);
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', login);
/**
 * @swagger
 * /api/users/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Email verified
 */
router.post('/verify-email', verifyEmail);
/**
 * @swagger
 * /api/users/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Email resent
 */
router.post('/resend-verification', resendVerification);
/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Reset link sent
 */
router.post('/forgot-password', forgotPassword);
/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post('/reset-password', resetPassword);

// Google OAuth entry and callback.
/**
 * @swagger
 * /api/users/oauth/google:
 *   get:
 *     summary: Initiate Google OAuth
 *     tags: [Users]
 *     responses:
 *       302:
 *         description: Redirects to Google
 *
 * /api/users/oauth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Authentication successful
 */
router.get('/oauth/google', startGoogleOAuth);
/**
 * @swagger
 * /api/users/oauth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.get('/oauth/google/callback', googleCallback);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Returns current user data
 */
router.get('/me', requireAuth, getMe);
// Profile-by-id stays verified-only to avoid exposing unverified accounts.
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User profile details
 *       401:
 *         description: Unauthorized - Login required
 *       403:
 *         description: Forbidden - Email verification required
 */
router.get('/:id', requireAuth, requireVerifiedEmail, getProfile);

module.exports = router;
