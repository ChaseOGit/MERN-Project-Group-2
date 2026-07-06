const express = require('express');
const router = express.Router();
const Device = require('../models/Device'); // use lowercase 'd' here

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
        // Create an empty filter object
        let filters = {};

        // If the user appended ?location=... to the URL, add it to our MongoDB query
        if (req.query.location) {
            filters.location = req.query.location;
        }

        // If the user appended ?category=... to the URL, add it to our MongoDB query
        if (req.query.category) {
            filters.category = req.query.category;
        }

        // Pass the filters object directly into .find()
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

router.get('/seed', async (req, res) => {
    const mockDevices = [
        { 
            name: "Dell Latitude 5420 Laptop", category: "Laptops", serialNumber: "SN-12345", 
            location: "John C. Hitt Library", loanPeriod: "7 Days", overdueFeeRate: 15, isAvailable: true,
            image: "https://p11.zdassets.com/hc/theme_assets/1179782/200326467/laptop.png"
        },
        { 
            name: "Dell Latitude 5420 Laptop", category: "Laptops", serialNumber: "SN-12346", 
            location: "John C. Hitt Library", loanPeriod: "7 Days", overdueFeeRate: 15, isAvailable: false,
            image: "https://p11.zdassets.com/hc/theme_assets/1179782/200326467/laptop.png"
        },
        { 
            name: "Sony Alpha a6400 Camera", category: "Cameras", serialNumber: "SN-67890", 
            location: "Downtown Campus", loanPeriod: "3 Days", overdueFeeRate: 25, isAvailable: false 
        },
        { 
            name: "USB-C to HDMI Adapter", category: "Accessories", serialNumber: "SN-11111", 
            location: "John C. Hitt Library", loanPeriod: "4 Hours", overdueFeeRate: 5, isAvailable: true 
        }
    ];

    try {
        await Device.deleteMany({}); 
        await Device.insertMany(mockDevices);
        res.json({ success: true, message: "Database seeded successfully with new UCF requirements!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Seeding failed: " + error.message });
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
