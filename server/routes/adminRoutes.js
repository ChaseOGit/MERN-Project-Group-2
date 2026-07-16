const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { runNearDueReminderJob } = require('../services/rentalReminderService');

// Manual trigger endpoint for reminder job (useful for cron/external schedulers).
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

module.exports = router;
