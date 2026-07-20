const express = require('express');
const router = express.Router();
const {
  register, login, getProfile, getMe, verifyEmail,
  resendVerification, forgotPassword, resetPassword,
  startGoogleOAuth, googleCallback
} = require('../controllers/userController');
const { requireAuth, requireVerifiedEmail } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new local account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [Student, Faculty, Admin] }
 *     responses:
 *       201:
 *         description: Registration successful (Email verification required)
 */
router.post('/register', register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log into a local account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful (Returns JWT Token)
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email is not verified
 */
router.post('/login', login);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Returns the user object
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 */
router.get('/me', requireAuth, getMe);

// Other Auth & Lifecycle endpoints
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth endpoints
router.get('/oauth/google', startGoogleOAuth);
router.get('/oauth/google/callback', googleCallback);

// Profile by ID
router.get('/:id', requireAuth, requireVerifiedEmail, getProfile);

module.exports = router;