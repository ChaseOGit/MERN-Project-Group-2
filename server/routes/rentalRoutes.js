const express = require('express');
const router = express.Router();

// Import the security middleware from the OAuth update
const { requireAuth, requireVerifiedEmail } = require('../middleware/authMiddleware');

// Import the functions from the controller
const { rentDevice, returnDevice, getMyLoans, filterItems, cancelReservation } = require('../controllers/rentalController');

//  Define the endpoints (Protected by the JWT security checks)

/**
 * @swagger
 * /api/rentals/checkout:
 *   post:
 *     summary: Check out a device
 *     tags: [Rental]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId: { type: string }
 *               conditionAtCheckout: { type: string }
 *     responses:
 *       200:
 *         description: Device successfully checked out
 */
router.post('/checkout', requireAuth, requireVerifiedEmail, rentDevice);

/**
 * @swagger
 * /api/rentals/return:
 *   post:
 *     summary: Return a device
 *     tags: [Rental]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId: { type: string }
 *               conditionAtReturn: { type: string }
 *     responses:
 *       200:
 *         description: Device successfully returned
 */
router.post('/return', requireAuth, requireVerifiedEmail, returnDevice);

/**
 * @swagger
 * /api/rentals/my-loans:
 *   get:
 *     summary: Get all active loans for the logged-in user
 *     tags: [Rental]
 *     responses:
 *       200:
 *         description: A list of active transactions
 */
router.get('/my-loans', requireAuth, getMyLoans);

/**
 * @swagger
 * /api/rentals/items:
 *   get:
 *     summary: Filter available inventory
 *     tags: [Rental]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of items matching filters
 */
router.get('/items', filterItems);

module.exports = router;