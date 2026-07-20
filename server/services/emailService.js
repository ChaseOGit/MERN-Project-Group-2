const { Resend } = require('resend');

// Initialize Resend (Returns null if API key is missing)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Frontend host is used to generate clickable links in outbound emails.
function frontendBaseUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

// Centralized sender identity
function fromAddress() {
  // Free Resend accounts MUST use onboarding@resend.dev
  return process.env.EMAIL_FROM || 'onboarding@resend.dev'; 
}

// 🚀 UPGRADED: Now uses Resend HTTP API instead of Nodemailer SMTP
async function sendMail({ to, subject, text, html }) {
  if (!resend) {
    console.log('\n⚠️ [EMAIL:MOCK MODE ACTIVE] RESEND_API_KEY is missing in the .env file!');
    console.log(`Pretending to send email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}\n`);
    return { mocked: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `UCF Tech Lending <${fromAddress()}>`,
      to: [to],
      subject: subject,
      html: html,
      text: text
    });

    if (error) {
      console.error('\n❌ [RESEND:API ERROR] Resend rejected the email!');
      console.error('NOTE: On the free tier, you can only send emails to the address you registered your Resend account with!');
      console.error(error);
      throw error;
    }

    console.log('✅ [RESEND:SUCCESS] Email successfully sent to:', to);
    return data;
  } catch (error) {
    console.error('\n❌ [RESEND:ERROR] Failed to execute email send request.');
    console.error(error);
    throw error;
  }
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