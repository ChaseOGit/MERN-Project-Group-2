const express = require('express');
const router = express.Router();
const { requireAuth, requireVerifiedEmail } = require('../middleware/authMiddleware');

// Import the rental controller file you made earlier
const { rentDevice, returnDevice } = require('../controllers/rentalController');

// Both endpoints require a signed-in user with verified email.
router.post('/checkout', requireAuth, requireVerifiedEmail, rentDevice);
router.post('/return', requireAuth, requireVerifiedEmail, returnDevice);

module.exports = router;
