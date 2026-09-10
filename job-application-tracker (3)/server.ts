import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { hashPassword } from './server/db';
import { connectMongoDB, isMongoActive } from './server/mongo';
import * as repo from './server/repository';
import { sendOtpEmail, sendPasswordResetEmail } from './server/email';
import { analyzeResumeWithGemini } from './server/aiAnalyzer';
import { classifyEmailWithAI, EmailInputPayload } from './server/gmailClassifier';
import { applyGmailEventAction, dismissGmailEvent } from './server/gmailSyncService';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Token helper
function parseAuthUser(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (token.startsWith('user-token-')) {
    return token.replace('user-token-', '');
  }
  if (token === 'demo-token') {
    return 'demo-student-id-101';
  }
  return null;
}

// Authentication middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = parseAuthUser(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Please login to continue.' });
  }
  (req as any).userId = userId;
  next();
}

// --- API ROUTES ---

// Health check with DB status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isMongoActive() ? 'MongoDB (Mongoose)' : 'Local File-Document Store',
    mongoConnected: isMongoActive(),
    timestamp: new Date().toISOString(),
  });
});

// In-memory OTP storage
interface OtpRecord {
  otp: string;
  email: string;
  name?: string;
  expiresAt: number;
}
const otpStore = new Map<string, OtpRecord>();

// Auth: Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await repo.findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(normalizedEmail, {
      otp,
      email: normalizedEmail,
      name: name?.trim(),
      expiresAt,
    });

    // Send the verification code directly to the student's email inbox
    await sendOtpEmail(normalizedEmail, name?.trim() || 'Student', otp);

    console.log(`[OTP] Verification email dispatched to ${normalizedEmail}`);

    return res.json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}. Please check your email inbox.`,
      expiresIn: 600,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// Auth: Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = otpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email or it has expired.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' });
    }

    return res.json({
      success: true,
      verified: true,
      message: 'Email address verified successfully!',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Failed to verify code.' });
  }
});

// In-memory Password Reset OTP storage
interface PasswordResetRecord {
  otp: string;
  email: string;
  expiresAt: number;
  verified: boolean;
}
const passwordResetStore = new Map<string, PasswordResetRecord>();

// Auth: Forgot Password - Send OTP
app.post('/api/auth/forgot-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid registered email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await repo.findUserByEmail(normalizedEmail);
    if (!existingUser) {
      return res.status(404).json({
        error: 'No registered student account was found with this email address. Please check spelling or register.',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    passwordResetStore.set(normalizedEmail, {
      otp,
      email: normalizedEmail,
      expiresAt,
      verified: false,
    });

    // Dispatch the password reset email
    await sendPasswordResetEmail(normalizedEmail, existingUser.name || 'Student', otp);

    console.log(`[Forgot Password] Reset code dispatched to ${normalizedEmail}`);

    return res.json({
      success: true,
      message: `Password reset code sent to ${normalizedEmail}. Please check your email inbox.`,
      expiresIn: 600,
    });
  } catch (error: any) {
    console.error('Forgot password send-otp error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request. Please try again.' });
  }
});

// Auth: Forgot Password - Verify OTP
app.post('/api/auth/forgot-password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and reset code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = passwordResetStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ error: 'No active password reset request found. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      passwordResetStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'Password reset code has expired. Please request a new one.' });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Incorrect verification code. Please check your email.' });
    }

    record.verified = true;
    passwordResetStore.set(normalizedEmail, record);

    return res.json({
      success: true,
      verified: true,
      message: 'Code verified successfully! You may now set your new password.',
    });
  } catch (error: any) {
    console.error('Forgot password verify-otp error:', error);
    return res.status(500).json({ error: 'Failed to verify reset code.' });
  }
});

// Auth: Forgot Password - Reset Password
app.post('/api/auth/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = passwordResetStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ error: 'No active password reset request found for this email. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      passwordResetStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'Password reset session has expired. Please request a new code.' });
    }

    // Verify OTP matches if not already flagged verified
    if (!record.verified && record.otp !== otp?.toString().trim()) {
      return res.status(400).json({ error: 'Invalid or unverified reset code.' });
    }

    const success = await repo.updateUserPassword(normalizedEmail, newPassword);
    if (!success) {
      return res.status(404).json({ error: 'Unable to update password. User not found.' });
    }

    passwordResetStore.delete(normalizedEmail);
    console.log(`[Forgot Password] Successfully updated password for ${normalizedEmail}`);

    return res.json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.',
    });
  } catch (error: any) {
    console.error('Forgot password reset error:', error);
    return res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, college, graduationYear, branch } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = await repo.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const user = await repo.createUser({
      name,
      email,
      password,
      college,
      graduationYear,
      branch,
    });

    const token = `user-token-${user.id}`;
    return res.status(201).json({ user, token, message: 'Registration successful!' });
  } catch (error: any) {
    console.error('Register error:', error);
    if (error?.code === 11000 || error?.message?.includes('duplicate key') || error?.message?.includes('E11000')) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }
    return res.status(400).json({ error: error?.message || 'Registration failed. Please try again.' });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRecord = await repo.findUserByEmail(email);
    if (!userRecord) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (userRecord.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { passwordHash, ...safeUser } = userRecord;
    const token = `user-token-${safeUser.id}`;
    res.json({ user: safeUser, token, message: 'Login successful!' });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Auth: Demo Login
app.post('/api/auth/demo', async (req, res) => {
  try {
    let demoUser = await repo.findUserById('demo-student-id-101');
    if (!demoUser) {
      demoUser = await repo.createUser({
        name: 'Shaurya Vardhan',
        email: 'shaurya@campus.edu',
        password: 'password123',
        college: 'National Institute of Technology',
        graduationYear: '2026',
        branch: 'Computer Science & Engineering',
      });
    } else if (demoUser.name === 'Tanish Sai' || demoUser.name === 'D Tanishsai') {
      demoUser.name = 'Shaurya Vardhan';
      demoUser.email = 'shaurya@campus.edu';
    }
    const token = `user-token-${demoUser.id}`;
    res.json({ user: demoUser, token, message: 'Logged in as Demo Student!' });
  } catch (error: any) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Failed to login demo user.' });
  }
});

// Auth: Me
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const user = await repo.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user });
});

// Auth: Update Profile
app.put('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const {
      name,
      studentId,
      college,
      branch,
      graduationYear,
      cgpa,
      phone,
      bio,
      resumeUrl,
      skills,
      codingProfiles,
      internships,
      certifications,
    } = req.body;

    const updatedUser = await repo.updateUserProfile(userId, {
      name,
      studentId,
      college,
      branch,
      graduationYear,
      cgpa,
      phone,
      bio,
      resumeUrl,
      skills,
      codingProfiles,
      internships,
      certifications,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: updatedUser, message: 'Student profile updated successfully!' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update student profile.' });
  }
});

// Applications: Get all
app.get('/api/applications', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const applications = await repo.getApplications(userId, search, status);
    res.json({ applications, total: applications.length });
  } catch (error: any) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// Applications: Create new application
app.post('/api/applications', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { company, role, packageLPA, applicationDate, status, jobType, location, jobLink, referral, notes, upcomingInterview } = req.body;

    if (!company || !role) {
      return res.status(400).json({ error: 'Company and Job Role are required fields.' });
    }

    const newApp = await repo.createApplication(userId, {
      company,
      role,
      packageLPA: Number(packageLPA) || 0,
      applicationDate: applicationDate || new Date().toISOString().split('T')[0],
      status: status || 'Applied',
      jobType: jobType || 'Full Time',
      location: location || 'Bengaluru, India',
      jobLink: jobLink || '',
      referral: referral || '',
      notes: notes || '',
      upcomingInterview,
    });

    res.status(201).json({ application: newApp, message: 'Application added successfully!' });
  } catch (error: any) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create job application.' });
  }
});

// Applications: Update application
app.put('/api/applications/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = req.params.id;

    const updated = await repo.updateApplication(id, userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Application not found or unauthorized.' });
    }

    res.json({ application: updated, message: 'Application updated successfully!' });
  } catch (error: any) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update job application.' });
  }
});

// Applications: Delete application
app.delete('/api/applications/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = req.params.id;

    const deleted = await repo.deleteApplication(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Application not found or already deleted.' });
    }

    res.json({ success: true, message: 'Application deleted successfully!' });
  } catch (error: any) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application.' });
  }
});

// Interviews: Get all upcoming interviews
app.get('/api/interviews', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const interviews = await repo.getInterviews(userId);
    res.json({ interviews });
  } catch (error: any) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews.' });
  }
});

// Interviews: Schedule / Update Interview
app.post('/api/interviews', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const interviewData = req.body;

    if (!interviewData.applicationId || !interviewData.date || !interviewData.roundType) {
      return res.status(400).json({ error: 'Application ID, Date, and Round Type are required.' });
    }

    const updatedApp = await repo.saveInterview(userId, interviewData);
    if (!updatedApp) {
      return res.status(404).json({ error: 'Application not found to schedule interview.' });
    }

    res.json({ application: updatedApp, message: 'Interview scheduled successfully!' });
  } catch (error: any) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ error: 'Failed to schedule interview.' });
  }
});

// Interviews: Remove interview
app.delete('/api/interviews/:applicationId', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const applicationId = req.params.applicationId;

    const updatedApp = await repo.deleteInterview(userId, applicationId);
    if (!updatedApp) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.json({ application: updatedApp, message: 'Interview removed.' });
  } catch (error: any) {
    console.error('Delete interview error:', error);
    res.status(500).json({ error: 'Failed to delete interview.' });
  }
});

// Analytics: Get Dashboard Statistics
app.get('/api/analytics', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const stats = await repo.getStats(userId);
    res.json({ stats });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to calculate analytics.' });
  }
});

// Reset / Seed Sample Applications
app.post('/api/reset-data', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const resetApps = await repo.resetToDefault(userId);
    const stats = await repo.getStats(userId);
    res.json({ applications: resetApps, stats, message: 'Sample placement data reset successfully.' });
  } catch (error: any) {
    console.error('Reset data error:', error);
    res.status(500).json({ error: 'Failed to reset data.' });
  }
});

// ==================== RESUME MANAGEMENT (METADATA ONLY) ====================
// Policy: The actual file blob is stored locally in the browser IndexedDB.
// The database only tracks metadata (resumeId, userId, name, fileName, createdAt, updatedAt, analysisId, isDefault).

// Get all resume metadata for the user
app.get('/api/resumes/metadata', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const resumes = await repo.getResumesMetadata(userId);
    res.json({
      resumes,
      storageNotice: 'Resumes are stored locally in your browser. MongoDB persists only sync metadata.',
    });
  } catch (error: any) {
    console.error('Get resumes metadata error:', error);
    res.status(500).json({ error: 'Failed to fetch resume metadata.' });
  }
});

// Save new resume metadata
app.post('/api/resumes/metadata', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { resumeId, name, fileName, createdAt, updatedAt, isDefault, analysisId } = req.body;

    if (!resumeId || !fileName) {
      return res.status(400).json({ error: 'resumeId and fileName are required.' });
    }

    const created = await repo.createResumeMetadata(userId, {
      resumeId,
      name: name || fileName,
      fileName,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
      isDefault: !!isDefault,
      analysisId: analysisId || '',
    });

    res.json({
      resume: created,
      message: 'Resume metadata synced successfully.',
    });
  } catch (error: any) {
    console.error('Create resume metadata error:', error);
    res.status(500).json({ error: 'Failed to save resume metadata.' });
  }
});

// Update resume metadata (e.g. rename)
app.put('/api/resumes/metadata/:resumeId', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const resumeId = req.params.resumeId;
    const { name, fileName, isDefault, analysisId } = req.body;

    const updated = await repo.updateResumeMetadata(userId, resumeId, {
      name,
      fileName,
      isDefault,
      analysisId,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Resume metadata not found.' });
    }

    res.json({
      resume: updated,
      message: 'Resume metadata updated.',
    });
  } catch (error: any) {
    console.error('Update resume metadata error:', error);
    res.status(500).json({ error: 'Failed to update resume metadata.' });
  }
});

// Delete resume metadata
app.delete('/api/resumes/metadata/:resumeId', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const resumeId = req.params.resumeId;

    const deleted = await repo.deleteResumeMetadata(userId, resumeId);
    if (!deleted) {
      return res.status(404).json({ error: 'Resume metadata not found.' });
    }

    res.json({ success: true, message: 'Resume metadata removed from server.' });
  } catch (error: any) {
    console.error('Delete resume metadata error:', error);
    res.status(500).json({ error: 'Failed to delete resume metadata.' });
  }
});

// Set default resume metadata
app.post('/api/resumes/metadata/:resumeId/set-default', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const resumeId = req.params.resumeId;

    const success = await repo.setDefaultResumeMetadata(userId, resumeId);
    if (!success) {
      return res.status(404).json({ error: 'Resume not found to set as default.' });
    }

    res.json({ success: true, message: 'Default resume updated.' });
  } catch (error: any) {
    console.error('Set default resume error:', error);
    res.status(500).json({ error: 'Failed to set default resume.' });
  }
});

// ==================== AI RESUME ANALYZER ====================
// Evaluates resume text content using Gemini API and returns detailed ATS score, strengths, weaknesses & suggestions.
app.post('/api/resumes/analyze', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { resumeId, resumeText, resumeName, targetRole, fileDataUrl, fileType } = req.body;

    const hasText = resumeText && typeof resumeText === 'string' && resumeText.trim().length >= 10;
    const hasFileData = fileDataUrl && typeof fileDataUrl === 'string' && fileDataUrl.length > 50;

    if (!hasText && !hasFileData) {
      return res.status(400).json({
        error: 'Please provide valid resume content or an uploaded document for analysis.',
      });
    }

    console.log(`[AI Analyzer] Analyzing resume for user ${userId} (Resume: "${resumeName || resumeId}")...`);
    const analysis = await analyzeResumeWithGemini(
      resumeText || '',
      resumeName,
      targetRole,
      fileDataUrl,
      fileType
    );
    analysis.resumeId = resumeId || 'res-local';
    analysis.id = 'analysis-' + Date.now();

    // If resumeId is provided, update analysisId in metadata
    if (resumeId) {
      await repo.updateResumeMetadata(userId, resumeId, { analysisId: analysis.id });
    }

    res.json({
      success: true,
      analysis,
      message: 'Resume analyzed successfully.',
    });
  } catch (error: any) {
    console.error('Analyze resume error:', error);
    res.status(500).json({
      error: error.message || 'Failed to complete AI resume analysis.',
    });
  }
});

// Public OAuth configuration endpoint
app.get('/api/auth/oauth-config', (req, res) => {
  res.json({
    oAuthClientId: process.env.GOOGLE_CLIENT_ID || '437357842459-1cq2jcpibp4rcpjovho0qt3e0k0s1mrs.apps.googleusercontent.com',
  });
});

// ==================== GMAIL JOB EMAIL SYNC & REVIEW ENDPOINTS ====================

// Get Gmail sync settings and pending count
app.get('/api/gmail/settings', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const settings = await repo.getGmailSettings(userId);
    res.json({ success: true, settings });
  } catch (error: any) {
    console.error('Get Gmail settings error:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail settings.' });
  }
});

// Update Gmail sync settings (e.g. autoSyncHighConfidence, minConfidenceThreshold)
app.put('/api/gmail/settings', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { autoSyncHighConfidence, minConfidenceThreshold, connectedEmail, isConnected } = req.body;
    const updated = await repo.updateGmailSettings(userId, {
      ...(autoSyncHighConfidence !== undefined ? { autoSyncHighConfidence: !!autoSyncHighConfidence } : {}),
      ...(minConfidenceThreshold !== undefined ? { minConfidenceThreshold: Number(minConfidenceThreshold) } : {}),
      ...(connectedEmail !== undefined ? { connectedEmail: String(connectedEmail) } : {}),
      ...(isConnected !== undefined ? { isConnected: !!isConnected } : {}),
    });
    res.json({ success: true, settings: updated, message: 'Gmail settings updated.' });
  } catch (error: any) {
    console.error('Update Gmail settings error:', error);
    res.status(500).json({ error: 'Failed to update Gmail settings.' });
  }
});

// Disconnect Gmail integration
app.post('/api/gmail/disconnect', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const updated = await repo.updateGmailSettings(userId, {
      isConnected: false,
      connectedEmail: '',
    });
    res.json({ success: true, settings: updated, message: 'Gmail disconnected.' });
  } catch (error: any) {
    console.error('Disconnect Gmail error:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail.' });
  }
});

// List classified Gmail events
app.get('/api/gmail/events', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { status, jobRelatedOnly } = req.query;
    let events = await repo.getGmailEvents(userId);

    if (jobRelatedOnly === 'true') {
      events = events.filter(e => e.isJobRelated);
    }
    if (status && typeof status === 'string') {
      events = events.filter(e => e.reviewStatus === status);
    }

    res.json({ success: true, events, count: events.length });
  } catch (error: any) {
    console.error('Get Gmail events error:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail events.' });
  }
});

// Batch classify and sync incoming emails
app.post('/api/gmail/sync-batch', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { emails, userEmail } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Emails array is required.' });
    }

    const settings = await repo.getGmailSettings(userId);
    const existingApps = await repo.getApplicationsByUserId(userId);
    const classifiedEvents = [];
    const autoAppliedEvents = [];

    // Mark connected if userEmail is passed
    if (userEmail && (!settings.isConnected || settings.connectedEmail !== userEmail)) {
      await repo.updateGmailSettings(userId, {
        isConnected: true,
        connectedEmail: userEmail,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    for (const emailPayload of emails.slice(0, 25)) {
      try {
        const classified = await classifyEmailWithAI(emailPayload as EmailInputPayload, existingApps);
        const savedEvent = await repo.saveGmailEvent(userId, classified);

        // Check if auto-sync should apply:
        // Only if autoSync is enabled, event is job-related, confidence >= threshold, and status is PENDING_REVIEW
        if (
          settings.autoSyncHighConfidence &&
          savedEvent.isJobRelated &&
          savedEvent.confidence >= (settings.minConfidenceThreshold || 0.90) &&
          savedEvent.reviewStatus === 'PENDING_REVIEW' &&
          savedEvent.proposedAction !== 'NO_ACTION'
        ) {
          try {
            const syncResult = await applyGmailEventAction(userId, savedEvent.id);
            autoAppliedEvents.push({
              eventId: savedEvent.id,
              company: savedEvent.companyName,
              action: savedEvent.proposedAction,
              result: syncResult.message,
            });
            classifiedEvents.push(syncResult.event);
          } catch (syncErr) {
            console.error('Auto sync error for event:', savedEvent.id, syncErr);
            classifiedEvents.push(savedEvent);
          }
        } else {
          classifiedEvents.push(savedEvent);
        }
      } catch (classifyErr) {
        console.error('Failed to classify individual email:', emailPayload.messageId, classifyErr);
      }
    }

    await repo.updateGmailSettings(userId, {
      lastSyncedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      events: classifiedEvents,
      processedCount: classifiedEvents.length,
      autoAppliedCount: autoAppliedEvents.length,
      autoAppliedEvents,
      message: `Processed ${classifiedEvents.length} emails. ${autoAppliedEvents.length} high-confidence events synchronized automatically.`,
    });
  } catch (error: any) {
    console.error('Sync batch error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync emails.' });
  }
});

// Approve / Apply a proposed action for a specific Gmail event
app.post('/api/gmail/events/:id/apply', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { companyName, jobTitle, status, interviewDate, interviewTime, meetingLink } = req.body || {};

    const result = await applyGmailEventAction(userId, id, {
      companyName,
      jobTitle,
      status,
      interviewDate,
      interviewTime,
      meetingLink,
    });

    res.json({
      success: true,
      event: result.event,
      application: result.application,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Apply Gmail event error:', error);
    res.status(500).json({ error: error.message || 'Failed to apply proposed action.' });
  }
});

// Dismiss a Gmail event
app.post('/api/gmail/events/:id/dismiss', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const dismissed = await dismissGmailEvent(userId, id);
    res.json({
      success: true,
      event: dismissed,
      message: 'Event dismissed.',
    });
  } catch (error: any) {
    console.error('Dismiss Gmail event error:', error);
    res.status(500).json({ error: error.message || 'Failed to dismiss event.' });
  }
});

// Batch approve all pending high-confidence events (>= 90%)
app.post('/api/gmail/events/approve-all-high-confidence', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const events = await repo.getGmailEvents(userId);
    const pendingHighConfidence = events.filter(
      e => e.reviewStatus === 'PENDING_REVIEW' && e.isJobRelated && e.confidence >= 0.90 && e.proposedAction !== 'NO_ACTION'
    );

    const results = [];
    for (const event of pendingHighConfidence) {
      try {
        const resApply = await applyGmailEventAction(userId, event.id);
        results.push(resApply);
      } catch (err) {
        console.error(`Failed to approve event ${event.id}:`, err);
      }
    }

    res.json({
      success: true,
      approvedCount: results.length,
      message: `Successfully approved and synchronized ${results.length} high-confidence job updates.`,
    });
  } catch (error: any) {
    console.error('Approve all high confidence error:', error);
    res.status(500).json({ error: 'Failed to approve high confidence events.' });
  }
});

// Start Server and attach Vite middleware
async function startServer() {
  // Initialize MongoDB connection asynchronously
  await connectMongoDB();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
