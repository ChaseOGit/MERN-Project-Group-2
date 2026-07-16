const express = require('express');
const router = express.Router();
const { requireAuth, requireVerifiedEmail } = require('../middleware/authMiddleware');

// Import the rental controller file you made earlier
const { checkoutDevice, returnDevice, getMyLoans } = require('../controllers/rentalController');

// Both endpoints require a signed-in user with verified email.
router.post('/checkout', requireAuth, requireVerifiedEmail, rentDevice);
router.post('/return', requireAuth, requireVerifiedEmail, returnDevice);

//Added the new endpoint for fetching loans
router.get('/my-loans', requireAuth, requireVerifiedEmail, getMyLoans);

module.exports = router;
