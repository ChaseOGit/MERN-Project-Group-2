const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { runNearDueReminderJob } = require('../services/rentalReminderService');

// Manual trigger endpoint for reminder job (useful for cron/external schedulers).
router.post('/jobs/reminder-near-due', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const result = await runNearDueReminderJob();
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to run reminder job', error: error.message });
  }
});

module.exports = router;
