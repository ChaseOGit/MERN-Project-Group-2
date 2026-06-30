const express = require('express');
const router = express.Router();
const Item = require('../models/device');

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Retrieve a list of all tech items
 *     description: Fetches inventory. Can optionally be filtered.
 *     responses:
 *       200:
 *         description: A list of items.
 */

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

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Add a new tech item to the inventory (Admin only eventually)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: string
 *               availability:
 *                 type: number
 *               loanPeriod:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item created successfully
 */
router.post('/', async (req, res) => {
    try {
        const newItem = new Item(req.body);
        const savedItem = await newItem.save();
        res.status(201).json({ success: true, data: savedItem });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// SECRET SEED ROUTE: Run this once in Postman/Browser to fill your database!
router.post('/seed', async (req, res) => {
    const mockData = [
        { name: "Dell Latitude 5420 Laptop", category: "Laptops", location: "John C. Hitt Library", availability: 5, loanPeriod: "7 Days", restrictedTo: "All" },
        { name: "Sony Alpha a6400 Camera", category: "Cameras", location: "Downtown Campus", availability: 0, loanPeriod: "3 Days", restrictedTo: "Faculty" },
        { name: "USB-C to HDMI Adapter", category: "Accessories", location: "John C. Hitt Library", availability: 12, loanPeriod: "4 Hours", restrictedTo: "All" }
    ];
    try {
        await Item.insertMany(mockData);
        res.json({ success: true, message: "Database seeded successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Seeding failed" });
    }
});

module.exports = router;