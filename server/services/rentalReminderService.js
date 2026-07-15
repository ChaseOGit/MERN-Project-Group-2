const Device = require('../models/Device');
const User = require('../models/users');
const { sendMail } = (() => {
  // Lazy import pattern to avoid circular deps while keeping explicit callsite.
  const emailService = require('./emailService');
  return {
    sendMail: emailService.sendMail || null,
  };
})();

// Converts human-readable loan periods (hours/days) into day values for due math.
function parseLoanPeriodToDays(loanPeriod) {
  if (!loanPeriod || typeof loanPeriod !== 'string') return null;

  const normalized = loanPeriod.toLowerCase().trim();

  if (normalized.includes('hour')) {
    const hours = Number(normalized.split(' ')[0]);
    if (Number.isNaN(hours)) return null;
    return hours / 24;
  }

  if (normalized.includes('day')) {
    const days = Number(normalized.split(' ')[0]);
    if (Number.isNaN(days)) return null;
    return days;
  }

  return null;
}

// Scans active rentals and sends at most one reminder within the 24-hour due window.
async function runNearDueReminderJob() {
  if (!sendMail) {
    return { checked: 0, sent: 0, skipped: 0, reason: 'email transport unavailable' };
  }

  const devices = await Device.find({
    isAvailable: false,
    currentRenter: { $ne: null },
  }).lean();

  let sent = 0;
  let skipped = 0;

  for (const device of devices) {
    // Use the most recent open rental record for each checked-out device.
    const openHistory = (device.rentalHistory || [])
      .filter((h) => h && h.rentedAt && !h.returnedAt)
      .sort((a, b) => new Date(b.rentedAt) - new Date(a.rentedAt))[0];

    if (!openHistory) {
      skipped += 1;
      continue;
    }

    const loanDays = parseLoanPeriodToDays(device.loanPeriod);
    if (!loanDays) {
      skipped += 1;
      continue;
    }

    const dueAt = new Date(new Date(openHistory.rentedAt).getTime() + loanDays * 24 * 60 * 60 * 1000);
    const hoursUntilDue = (dueAt.getTime() - Date.now()) / (60 * 60 * 1000);

    // near due window: between 0 and 24 hours from now
    if (hoursUntilDue < 0 || hoursUntilDue > 24) {
      skipped += 1;
      continue;
    }

    const user = await User.findById(device.currentRenter).lean();
    if (!user || !user.notificationPreferences?.rentalReminder) {
      skipped += 1;
      continue;
    }

    // Reminder key prevents duplicate sends for the same rental window.
    const historyId = openHistory._id ? openHistory._id.toString() : `${device._id}-${new Date(openHistory.rentedAt).toISOString()}`;
    const reminderKey = `reminder:${historyId}:24h`;

    const hasAlreadySent = (device.notificationLog || []).some((entry) => entry.key === reminderKey);
    if (hasAlreadySent) {
      skipped += 1;
      continue;
    }

    await sendMail({
      to: user.email,
      subject: `Reminder: ${device.name} is due soon`,
      text: `Hi ${user.name},\n\nYour borrowed item (${device.name}) is due within 24 hours. Please return it by ${dueAt.toLocaleString()}.`,
      html: `<p>Hi ${user.name},</p><p>Your borrowed item <strong>${device.name}</strong> is due within 24 hours.</p><p>Please return it by ${dueAt.toLocaleString()}.</p>`,
    });

    await Device.findByIdAndUpdate(device._id, {
      $push: {
        notificationLog: {
          key: reminderKey,
          sentAt: new Date(),
          type: 'reminder',
        },
      },
    });

    sent += 1;
  }

  return {
    checked: devices.length,
    sent,
    skipped,
  };
}

module.exports = {
  runNearDueReminderJob,
};
