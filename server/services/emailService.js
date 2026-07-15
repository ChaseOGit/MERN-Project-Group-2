const nodemailer = require('nodemailer');

let transporter = null;

// Creates one reusable SMTP transporter per process; returns null in mock mode.
function createTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

// Frontend host is used to generate clickable links in outbound emails.
function frontendBaseUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

// Centralized sender identity keeps all transactional mail consistent.
function fromAddress() {
  return process.env.EMAIL_FROM || 'noreply@ucftechlib.local';
}

// If SMTP is not configured, log to console so development can continue safely.
async function sendMail({ to, subject, text, html }) {
  const client = createTransporter();

  if (!client) {
    console.log('[email:mock]', { to, subject, text });
    return { mocked: true };
  }

  return client.sendMail({ from: fromAddress(), to, subject, text, html });
}

// Sends verification link used to activate newly created local accounts.
async function sendVerificationEmail({ to, name, token }) {
  const verifyUrl = `${frontendBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Verify your UCF Tech Lending account';
  const text = `Hi ${name},\n\nPlease verify your account by opening this link:\n${verifyUrl}\n\nIf you did not create this account, you can ignore this email.`;
  const html = `<p>Hi ${name},</p><p>Please verify your account by opening this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>If you did not create this account, you can ignore this email.</p>`;
  return sendMail({ to, subject, text, html });
}

// Sent once a user successfully verifies their account.
async function sendWelcomeEmail({ to, name }) {
  const subject = 'Welcome to UCF Tech Lending';
  const text = `Hi ${name},\n\nYour account is now verified. You can borrow eligible devices from UCF Tech Lending.`;
  const html = `<p>Hi ${name},</p><p>Your account is now verified. You can borrow eligible devices from UCF Tech Lending.</p>`;
  return sendMail({ to, subject, text, html });
}

// Checkout confirmation gives users a written reminder of loan period.
async function sendCheckoutEmail({ to, name, deviceName, loanPeriod }) {
  const subject = `Checkout confirmed: ${deviceName}`;
  const text = `Hi ${name},\n\nYou checked out ${deviceName}.\nLoan period: ${loanPeriod}.`;
  const html = `<p>Hi ${name},</p><p>You checked out <strong>${deviceName}</strong>.</p><p>Loan period: ${loanPeriod}.</p>`;
  return sendMail({ to, subject, text, html });
}

// Return confirmation closes the rental loop for the user.
async function sendReturnEmail({ to, name, deviceName }) {
  const subject = `Return confirmed: ${deviceName}`;
  const text = `Hi ${name},\n\nYour return for ${deviceName} has been recorded. Thank you.`;
  const html = `<p>Hi ${name},</p><p>Your return for <strong>${deviceName}</strong> has been recorded. Thank you.</p>`;
  return sendMail({ to, subject, text, html });
}

// Password reset flow uses a dedicated message and reset-specific URL.
async function sendPasswordResetEmail({ to, name, token }) {
  const resetUrl = `${frontendBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Reset your UCF Tech Lending password';
  const text = `Hi ${name},\n\nUse this link to reset your password:\n${resetUrl}\n\nIf you did not request this reset, you can ignore this email.`;
  const html = `<p>Hi ${name},</p><p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this reset, you can ignore this email.</p>`;
  return sendMail({ to, subject, text, html });
}

module.exports = {
  sendMail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendCheckoutEmail,
  sendReturnEmail,
  sendPasswordResetEmail,
};
