const express = require('express');
const router = express.Router();

// Import the security middleware from the OAuth update
const { requireAuth, requireVerifiedEmail } = require('../middleware/authMiddleware');

// Import the functions from the controller
const { rentDevice, returnDevice, getMyLoans, filterItems } = require('../controllers/rentalController');

//  Define the endpoints (Protected by the JWT security checks)
router.post('/checkout', requireAuth, requireVerifiedEmail, rentDevice);
router.post('/return', requireAuth, requireVerifiedEmail, returnDevice);
router.get('/items', filterItems);

module.exports = router;
