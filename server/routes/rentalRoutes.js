const express = require('express');
const router = express.Router();

// Import the rental controller file you made earlier
const { rentDevice, returnDevice } = require('../controllers/rentalController');

// Define the endpoints for checkout and return
router.post('/checkout', rentDevice);
router.post('/return', returnDevice);

module.exports = router;
