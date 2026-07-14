const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Retrieve a filtered list of all devices
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter devices by library location (e.g., "John C. Hitt Library")
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter devices by category (e.g., "Laptops")
 *     responses:
 *       200:
 *         description: A filtered list of devices.
 */
router.get('/', async (req, res) => {
    try {
        let filters = {};
        if (req.query.location) filters.location = req.query.location;
        if (req.query.category) filters.category = req.query.category;

        const devices = await Device.find(filters);
        res.json({ success: true, data: devices });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Add a new device
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - serialNumber
 *               - location
 *               - loanPeriod
 *               - overdueFeeRate
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               location:
 *                 type: string
 *               loanPeriod:
 *                 type: string
 *               overdueFeeRate:
 *                 type: number
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Device created successfully.
 */
router.post('/', async (req, res) => {
    try {
        const newDevice = new Device(req.body);
        const savedDevice = await newDevice.save();
        res.status(201).json({ success: true, data: savedDevice });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/devices/barcode/{upc}:
 *   get:
 *     summary: Proxy route to fetch barcode data from global UPC database (Bypasses Browser CORS)
 *     parameters:
 *       - in: path
 *         name: upc
 *         required: true
 *         schema:
 *           type: string
 *         description: The barcode/UPC string extracted from the image
 *     responses:
 *       200:
 *         description: External API data containing product details
 */
router.get('/barcode/:upc', async (req, res) => {
    try {
        const upcUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${req.params.upc}`;
        
        // Node 18+ has native fetch built-in Bypasses browser CORS rules.
        const response = await fetch(upcUrl);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: "Barcode API lookup failed." });
    }
});

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     summary: Update an existing device by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       404:
 *         description: Device not found
 */
router.put('/:id', async (req, res) => {
    try {
        const updatedDevice = await Device.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );

        if (!updatedDevice) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        res.json({ success: true, data: updatedDevice });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     summary: Delete a device by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The device ID
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *       404:
 *         description: Device not found
 */
router.delete('/:id', async (req, res) => {
    try {
        const deletedDevice = await Device.findByIdAndDelete(req.params.id);

        if (!deletedDevice) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        res.json({ success: true, message: "Device removed from inventory successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;