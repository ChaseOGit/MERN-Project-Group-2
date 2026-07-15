const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/users');
const {
  signAuthToken,
  signEmailToken,
  verifyEmailToken,
} = require('../utils/tokenUtils');
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');

// Store only token hashes in DB so raw link tokens are never persisted.
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Removes sensitive/internal fields before sending user payloads to clients.
function buildSafeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    StudentIdNumber: user.StudentIdNumber,
    isEmailVerified: user.isEmailVerified,
    notificationPreferences: user.notificationPreferences,
  };
}

// Generates fallback student IDs for accounts without a provided ID.
function generateStudentId() {
  return `UCF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Creates a local account, stores verification metadata, and sends verify email.
async function register(req, res) {
  try {
    const { name, email, password, role, StudentIdNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const safeRole = ['Student', 'Faculty', 'Admin'].includes(role) ? role : 'Student';

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: safeRole,
      StudentIdNumber: StudentIdNumber || generateStudentId(),
      authProvider: 'local',
      isEmailVerified: false,
      notificationPreferences: { rentalReminder: true },
    });

    const token = signEmailToken(
      { userId: user._id.toString(), type: 'verify-email' },
      process.env.EMAIL_VERIFY_EXPIRES_IN || '24h'
    );

    user.emailVerificationTokenHash = hashToken(token);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.lastVerificationSentAt = new Date();
    await user.save();

    await sendVerificationEmail({ to: user.email, name: user.name, token });

    return res.status(201).json({
      message: 'Registration successful. Please verify your email before logging in.',
      requiresEmailVerification: true,
      user: buildSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Registration failed' });
  }
}

// Validates local credentials and blocks sign-in for unverified emails.
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Email is not verified',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    const authToken = signAuthToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token: authToken,
      user: buildSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed' });
  }
}

// Returns a user profile, limited to self unless requester is an Admin.
async function getProfile(req, res) {
  try {
    const targetUserId = req.params.id;

    if (req.user.role !== 'Admin' && req.user._id.toString() !== targetUserId) {
      return res.status(403).json({ message: 'You can only access your own profile' });
    }

    const user = await User.findById(targetUserId).populate('activeRentals');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: buildSafeUser(user), activeRentals: user.activeRentals });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
}

// Returns profile for the currently authenticated user.
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).populate('activeRentals');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user: buildSafeUser(user),
      activeRentals: user.activeRentals,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch profile' });
  }
}

// Verifies email token, activates account, and triggers welcome email.
async function verifyEmail(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const payload = verifyEmailToken(token);
    if (payload.type !== 'verify-email') {
      return res.status(400).json({ message: 'Invalid verification token type' });
    }

    const hashed = hashToken(token);
    const user = await User.findOne({
      _id: payload.userId,
      emailVerificationTokenHash: hashed,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Verification token is invalid or expired' });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;
    await user.save();

    await sendWelcomeEmail({ to: user.email, name: user.name });

    return res.status(200).json({ message: 'Email verification successful' });
  } catch (error) {
    return res.status(400).json({ message: 'Verification token is invalid or expired' });
  }
}

// Reissues verification link with a short cooldown to reduce abuse.
async function resendVerification(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const cooldownMs = 60 * 1000;
    if (user.lastVerificationSentAt && (Date.now() - new Date(user.lastVerificationSentAt).getTime() < cooldownMs)) {
      return res.status(429).json({ message: 'Please wait before requesting another verification email' });
    }

    const token = signEmailToken(
      { userId: user._id.toString(), type: 'verify-email' },
      process.env.EMAIL_VERIFY_EXPIRES_IN || '24h'
    );

    user.emailVerificationTokenHash = hashToken(token);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.lastVerificationSentAt = new Date();
    await user.save();

    await sendVerificationEmail({ to: user.email, name: user.name, token });

    return res.status(200).json({ message: 'Verification email has been resent' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to resend verification email' });
  }
}

// Starts reset flow and always returns a generic response to avoid email enumeration.
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({ message: 'If this account exists, reset instructions have been sent' });
    }

    const resetToken = signEmailToken(
      { userId: user._id.toString(), type: 'password-reset' },
      process.env.PASSWORD_RESET_EXPIRES_IN || '1h'
    );

    user.passwordResetTokenHash = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail({ to: user.email, name: user.name, token: resetToken });

    return res.status(200).json({ message: 'If this account exists, reset instructions have been sent' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to start password reset' });
  }
}

// Completes password reset when token is valid and not expired.
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and newPassword are required' });
    }

    const payload = verifyEmailToken(token);
    if (payload.type !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid token type' });
    }

    const user = await User.findOne({
      _id: payload.userId,
      passwordResetTokenHash: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or expired' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    return res.status(400).json({ message: 'Reset token is invalid or expired' });
  }
}

// Builds Google consent URL that frontend can redirect users to.
function startGoogleOAuth(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const state = req.query.state || 'default';

  if (!clientId || !redirectUri) {
    return res.status(500).json({ message: 'Google OAuth environment variables are not configured' });
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('access_type', 'online');
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('state', state);

  return res.status(200).json({ authUrl: authUrl.toString() });
}

// Exchanges OAuth code for profile, then creates/links user and returns app token.
async function googleCallback(req, res) {
  const code = req.query.code || req.body.code;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return res.status(400).json({ message: 'OAuth code is required' });
  }

  try {
    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      return res.status(400).json({ message: 'Failed to exchange OAuth code' });
    }

    const tokenData = await tokenResponse.json();

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      return res.status(400).json({ message: 'Failed to fetch Google profile' });
    }

    const profile = await profileResponse.json();
    if (!profile.email || !profile.sub) {
      return res.status(400).json({ message: 'Google profile is missing required fields' });
    }

    let user = await User.findOne({
      $or: [
        { providerId: profile.sub, authProvider: 'google' },
        { email: profile.email.toLowerCase() },
      ],
    });

    if (!user) {
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email.toLowerCase(),
        StudentIdNumber: generateStudentId(),
        authProvider: 'google',
        providerId: profile.sub,
        isEmailVerified: true,
      });
    } else if (!user.providerId) {
      user.providerId = profile.sub;
      user.authProvider = 'google';
      user.isEmailVerified = true;
      await user.save();
    }

    const authToken = signAuthToken(user);
    const redirectUrl = `${frontendUrl}/oauth/callback?token=${encodeURIComponent(authToken)}`;

    return res.redirect(redirectUrl);
  } catch (error) {
    return res.status(500).json({ message: 'Google OAuth callback failed', error: error.message });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  startGoogleOAuth,
  googleCallback,
};
