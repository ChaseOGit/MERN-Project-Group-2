const express = require('express');
const router = express.Router();

// Middleware
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { runNearDueReminderJob } = require('../services/rentalReminderService');

// Database Models needed for Circulation Desk lookup
const User = require('../models/users');
const Transactions = require('../models/Transactions');

/**
 * @swagger
 * /api/admin/jobs/reminder-near-due:
 *   post:
 *     summary: Manually trigger the near-due rental reminder job
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Reminder job executed successfully
 *       401:
 *         description: Unauthorized - Login required
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post('/jobs/reminder-near-due', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const result = await runNearDueReminderJob();
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to run reminder job', error: error.message });
  }
});


/**
 * @swagger
 * /api/admin/users/search:
 *   get:
 *     summary: Lookup students by Name, Email, or UCF ID
 *     description: Used by the Circulation Desk to find students for checkouts.
 *     tags: [Admin, Circulation]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (min 3 characters recommended)
 *     responses:
 *       200:
 *         description: A list of matching student accounts
 *       401:
 *         description: Unauthorized - Login required
 *       403:
 *         description: Forbidden - Admin or Faculty role required
 */
router.get('/users/search', requireAuth, requireRole('Admin', 'Faculty'), async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json({ success: true, data: [] });
        
        const users = await User.find({
            $or: [
                { email: new RegExp(q, 'i') },
                { StudentIdNumber: new RegExp(q, 'i') },
                { name: new RegExp(q, 'i') }
            ]
        }).limit(5); // Limit to 5 results to keep the UI clean
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


/**
 * @swagger
 * /api/admin/users/{id}/circulation:
 *   get:
 *     summary: Get a student's full circulation profile
 *     description: Fetches user details, active rentals, rental history, and calculates outstanding fines.
 *     tags: [Admin, Circulation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The User's MongoDB Object ID
 *     responses:
 *       200:
 *         description: Successfully retrieved circulation data
 *       401:
 *         description: Unauthorized - Login required
 *       403:
 *         description: Forbidden - Admin or Faculty role required
 *       404:
 *         description: User not found
 */
router.get('/users/:id/circulation', requireAuth, requireRole('Admin', 'Faculty'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Fetch all transactions for this user and populate the Device data
        const transactions = await Transactions.find({ UserID: req.params.id })
            .populate('ItemID')
            .sort({ createdAt: -1 });

        // Calculate total unpaid/outstanding fines
        let totalFines = 0;
        transactions.forEach(t => { 
            totalFines += (t.FineAmount || 0); 
        });

        res.json({ success: true, data: { user, transactions, totalFines } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;