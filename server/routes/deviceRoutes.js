const express = require('express');
const router = express.Router();
const Device = require('../models/Device'); // <-- THIS IS THE LINE THAT WAS MISSING!

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Retrieve a list of all devices
 *     responses:
 *       200:
 *         description: A list of devices.
 */
router.get('/', async (req, res) => {
    try {
        const devices = await Device.find({});
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
            name: "Dell Latitude 5420 Laptop", 
            category: "Laptops", 
            serialNumber: "SN-12345", 
            RentRate: 0, 
            isAvailable: true 
        },
        { 
            name: "Sony Alpha a6400 Camera", 
            category: "Cameras", 
            serialNumber: "SN-67890", 
            RentRate: 5, 
            isAvailable: false 
        },
        { 
            name: "USB-C to HDMI Adapter", 
            category: "Accessories", 
            serialNumber: "SN-11111", 
            RentRate: 0, 
            isAvailable: true 
        }
    ];

    try {
        // 1. Delete old test data so we don't get duplicate Serial Number errors
        await Device.deleteMany({}); 
        // 2. Insert the new devices
        await Device.insertMany(mockDevices);
        res.json({ success: true, message: "Database seeded successfully with Devices!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Seeding failed: " + error.message });
    }
});

module.exports = router;