import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  GraduationCap, 
  Building2, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Eye,
  Inbox,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onNavigateToPrivacy?: (e?: React.MouseEvent) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNavigateToPrivacy,
}) => {
  const { login, register, loginAsDemo, isLoading } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot-password'>('login');

  // Multi-step Registration states: 'identity' -> 'otp' -> 'details'
  const [regStep, setRegStep] = useState<'identity' | 'otp' | 'details'>('identity');

  // Multi-step Forgot Password states: 'email' -> 'otp' -> 'new-password' -> 'success'
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'new-password' | 'success'>('email');

  // Form states (Registration / Login)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [college, setCollege] = useState('IISC Bangalore');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [branch, setBranch] = useState('Computer Science & Engineering');

  // OTP Verification States (Register)
  const [otp, setOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState(false);
  const [isVerifyingForgotOtp, setIsVerifyingForgotOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Countdown timer for registration OTP
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Countdown timer for forgot password OTP
  useEffect(() => {
    if (forgotCountdown > 0) {
      const timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [forgotCountdown]);

  if (!isOpen) return null;

  // ==========================================
  // REGISTRATION HANDLERS
  // ==========================================
  // Step 1: Send OTP to Student Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid student email address.');
      return;
    }

    setIsSendingOtp(true);
    try {
      await api.sendOtp(email.trim(), name.trim());
      setRegStep('otp');
      setOtpCountdown(60);
      setSuccess(`Verification code sent to ${email.trim()}. Please check your email inbox!`);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!otp.trim() || otp.trim().length < 4) {
      setError('Please enter the 6-digit verification code from your email.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await api.verifyOtp(email.trim(), otp.trim());
      setSuccess('Email successfully verified! Proceed with password & academic details.');
      setRegStep('details');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 3: Complete Registration
  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        college: college.trim() || 'National Institute of Technology',
        graduationYear: graduationYear || '2026',
        branch: branch.trim() || 'Computer Science & Engineering',
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  // ==========================================
  // FORGOT PASSWORD HANDLERS
  // ==========================================
  // Step 1: Send Reset OTP to Registered Email
  const handleSendForgotOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setError('Please enter your registered student email address.');
      return;
    }

    setIsSendingForgotOtp(true);
    try {
      const res = await api.forgotPasswordSendOtp(forgotEmail.trim());
      setForgotStep('otp');
      setForgotCountdown(60);
      setSuccess(res.message || `Password reset code sent to ${forgotEmail.trim()}. Please check your email inbox!`);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset code. Please ensure your email is registered.');
    } finally {
      setIsSendingForgotOtp(false);
    }
  };

  // Step 2: Verify Forgot Password OTP
  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!forgotOtp.trim() || forgotOtp.trim().length < 4) {
      setError('Please enter the 6-digit reset code received in your email.');
      return;
    }

    setIsVerifyingForgotOtp(true);
    try {
      const res = await api.forgotPasswordVerifyOtp(forgotEmail.trim(), forgotOtp.trim());
      setSuccess(res.message || 'Code verified successfully! Now choose your new password.');
      setForgotStep('new-password');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired reset code. Please try again.');
    } finally {
      setIsVerifyingForgotOtp(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await api.forgotPasswordReset({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });
      setSuccess(res.message || 'Password reset successfully! You can now sign in with your new password.');
      setForgotStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Sign In Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide email and password.');
      return;
    }

    try {
      await login(email.trim(), password);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  const handleDemoClick = async () => {
    setError(null);
    try {
      await loginAsDemo();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to login demo account');
    }
  };

  const switchTab = (newTab: 'login' | 'register' | 'forgot-password') => {
    setTab(newTab);
    setRegStep('identity');
    setForgotStep('email');
    setError(null);
    setSuccess(null);
    setOtp('');
    setForgotOtp('');
    if (newTab === 'forgot-password' && email) {
      setForgotEmail(email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        id="auth-modal-content"
        className="bg-[#FCFCFA] rounded-2xl max-w-md w-full shadow-2xl border border-[#E5E5E1] overflow-hidden my-6"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E5E5E1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-[#FCFCFA] flex items-center justify-center font-black shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                {tab === 'login' && 'Student Sign In'}
                {tab === 'register' && 'Create Student Account'}
                {tab === 'forgot-password' && 'Reset Student Password'}
              </h3>
              <p className="text-xs text-[#737373]">Placement Application Tracking Journal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Show when in login or register mode) */}
        {tab !== 'forgot-password' ? (
          <div className="p-3 bg-[#F0F0EC] border-b border-[#E5E5E1] flex gap-2">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-[#1A1A1A] shadow-xs border border-[#E5E5E1]'
                  : 'text-[#737373] hover:text-[#1A1A1A]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-[#1A1A1A] shadow-xs border border-[#E5E5E1]'
                  : 'text-[#737373] hover:text-[#1A1A1A]'
              }`}
            >
              Register Student
            </button>
          </div>
        ) : (
          <div className="px-6 py-2.5 bg-[#FAF9F5] border-b border-[#E5E5E1] flex items-center justify-between">
            <button
              onClick={() => switchTab('login')}
              className="text-xs font-semibold text-[#525252] hover:text-[#1A1A1A] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
            <span className="text-[11px] font-mono text-[#737373] uppercase tracking-wider">
              {forgotStep === 'email' && 'Step 1/3: Email'}
              {forgotStep === 'otp' && 'Step 2/3: Code'}
              {forgotStep === 'new-password' && 'Step 3/3: Password'}
              {forgotStep === 'success' && 'Complete'}
            </span>
          </div>
        )}

        {/* Step Progress Tracker for Register Mode */}
        {tab === 'register' && (
          <div className="px-6 py-3 bg-[#FAF9F5] border-b border-[#E5E5E1]">
            <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase mb-1.5">
              <span className={regStep === 'identity' ? 'text-[#1A1A1A]' : 'text-emerald-700'}>
                1. Name & Email
              </span>
              <span className={regStep === 'otp' ? 'text-[#1A1A1A]' : regStep === 'details' ? 'text-emerald-700' : 'text-[#A3A3A3]'}>
                2. OTP Authorization
              </span>
              <span className={regStep === 'details' ? 'text-[#1A1A1A]' : 'text-[#A3A3A3]'}>
                3. Profile Details
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className={`h-1 rounded-full transition-all ${regStep === 'identity' ? 'bg-[#1A1A1A]' : 'bg-emerald-600'}`} />
              <div className={`h-1 rounded-full transition-all ${regStep === 'otp' ? 'bg-[#1A1A1A]' : regStep === 'details' ? 'bg-emerald-600' : 'bg-[#E5E5E1]'}`} />
              <div className={`h-1 rounded-full transition-all ${regStep === 'details' ? 'bg-[#1A1A1A]' : 'bg-[#E5E5E1]'}`} />
            </div>
          </div>
        )}

        {/* Step Progress Tracker for Forgot Password Mode */}
        {tab === 'forgot-password' && forgotStep !== 'success' && (
          <div className="px-6 py-3 bg-[#FAF9F5] border-b border-[#E5E5E1]">
            <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase mb-1.5">
              <span className={forgotStep === 'email' ? 'text-[#1A1A1A]' : 'text-emerald-700'}>
                1. Account Email
              </span>
              <span className={forgotStep === 'otp' ? 'text-[#1A1A1A]' : forgotStep === 'new-password' ? 'text-emerald-700' : 'text-[#A3A3A3]'}>
                2. Security OTP
              </span>
              <span className={forgotStep === 'new-password' ? 'text-[#1A1A1A]' : 'text-[#A3A3A3]'}>
                3. New Password
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className={`h-1 rounded-full transition-all ${forgotStep === 'email' ? 'bg-[#1A1A1A]' : 'bg-emerald-600'}`} />
              <div className={`h-1 rounded-full transition-all ${forgotStep === 'otp' ? 'bg-[#1A1A1A]' : forgotStep === 'new-password' ? 'bg-emerald-600' : 'bg-[#E5E5E1]'}`} />
              <div className={`h-1 rounded-full transition-all ${forgotStep === 'new-password' ? 'bg-[#1A1A1A]' : 'bg-[#E5E5E1]'}`} />
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: SIGN IN */}
          {/* ======================================================== */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-input-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    className="w-full pl-9.5 pr-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                    Password <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => switchTab('forgot-password')}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-input-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9.5 pr-9 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#737373]" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-auth"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2C2C2C] disabled:opacity-50 text-[#FCFCFA] text-xs font-semibold shadow-xs border border-[#1A1A1A] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Sign In to Journal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-[#E5E5E1]">
                <button
                  type="button"
                  id="btn-login-demo-modal"
                  onClick={handleDemoClick}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#E5E5E1] bg-[#F0F0EC] hover:bg-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Load Sample Data / Demo Account (Shaurya Vardhan)</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: REGISTER -> STEP 1 (NAME & EMAIL) */}
          {/* ======================================================== */}
          {tab === 'register' && regStep === 'identity' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-input-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shaurya Vardhan"
                    className="w-full pl-9.5 pr-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-input-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    className="w-full pl-9.5 pr-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    required
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[#737373]">
                  A 6-digit verification code will be sent to your email inbox.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp || !name.trim() || !email.trim()}
                className="w-full py-2.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2C2C2C] disabled:opacity-50 text-[#FCFCFA] text-xs font-semibold shadow-xs border border-[#1A1A1A] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSendingOtp ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Send Verification OTP to Email</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-[#E5E5E1]">
                <button
                  type="button"
                  id="btn-register-demo-modal"
                  onClick={handleDemoClick}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#E5E5E1] bg-[#F0F0EC] hover:bg-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Load Sample Data / Demo Account (Shaurya Vardhan)</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: REGISTER -> STEP 2 (OTP AUTHORIZATION) */}
          {/* ======================================================== */}
          {tab === 'register' && regStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Recipient card */}
              <div className="p-3.5 bg-white border border-[#E5E5E1] rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <p className="text-[11px] text-[#737373]">Sent verification code to:</p>
                  <p className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#737373]" />
                    {email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setRegStep('identity'); setError(null); }}
                  className="text-[11px] text-[#1A1A1A] font-semibold underline cursor-pointer hover:text-indigo-600"
                >
                  Change
                </button>
              </div>

              {/* Email Sent Information Notice */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Inbox className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  We have sent a 6-digit code to <span className="font-semibold text-amber-950">{email}</span>. Please check your inbox or spam folder and enter the code below.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Enter 6-Digit OTP Code <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1 2 3 4 5 6"
                    className="w-full pl-9.5 pr-3 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-sm font-mono font-bold tracking-widest text-center text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={otpCountdown > 0 || isSendingOtp}
                  className="text-xs text-[#737373] hover:text-[#1A1A1A] disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                  {otpCountdown > 0 ? `Resend code in ${otpCountdown}s` : 'Resend Email OTP'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otp.length < 4}
                className="w-full py-2.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2C2C2C] disabled:opacity-50 text-[#FCFCFA] text-xs font-semibold shadow-xs border border-[#1A1A1A] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isVerifyingOtp ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify Code & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: REGISTER -> STEP 3 (DETAILS & PASSWORD) */}
          {/* ======================================================== */}
          {tab === 'register' && regStep === 'details' && (
            <form onSubmit={handleFinalRegister} className="space-y-4">
              {/* Authorized Student Badge */}
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">{name}</p>
                    <p className="text-[11px] text-emerald-700">{email} (Authorized)</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
                  Verified
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Create Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full pl-9.5 pr-9 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#737373]" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  College / University
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. IISC Bangalore / GVP"
                    className="w-full pl-9.5 pr-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                    Graduation Year
                  </label>
                  <select
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026 (Upcoming)</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                    Branch / Major
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. CSE, ECE, IT"
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRegStep('otp')}
                  className="py-2.5 px-3 bg-[#F0F0EC] hover:bg-[#E5E5E1] border border-[#E5E5E1] text-[#1A1A1A] rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="flex-1 py-2.5 px-4 bg-[#1A1A1A] hover:bg-[#2C2C2C] disabled:opacity-50 text-[#FCFCFA] text-xs font-semibold rounded-lg shadow-xs border border-[#1A1A1A] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Student Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FORGOT PASSWORD -> STEP 1 (EMAIL ENTRY) */}
          {/* ======================================================== */}
          {tab === 'forgot-password' && forgotStep === 'email' && (
            <form onSubmit={handleSendForgotOtp} className="space-y-4">
              <div className="p-3 bg-[#FAF9F5] border border-[#E5E5E1] rounded-xl text-xs text-[#525252] leading-relaxed">
                Enter your registered student email address. We will dispatch a 6-digit security code to verify your identity and reset your password.
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Registered Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    className="w-full pl-9.5 pr-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingForgotOtp || !forgotEmail.trim()}
                className="w-full py-2.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2C2C2C] disabled:opacity-50 text-[#FCFCFA] text-xs font-semibold shadow-xs border border-[#1A1A1A] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSendingForgotOtp ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Send Password Reset Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="text-xs text-[#737373] hover:text-[#1A1A1A] font-medium cursor-pointer"
                >
                  Remembered your password? <span className="text-indigo-600 font-semibold underline">Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FORGOT PASSWORD -> STEP 2 (OTP VERIFICATION) */}
          {/* ======================================================== */}
          {tab === 'forgot-password' && forgotStep === 'otp' && (
            <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
              <div className="p-3.5 bg-white border border-[#E5E5E1] rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <p className="text-[11px] text-[#737373]">Sent reset code to:</p>
                  <p className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#737373]" />
                    {forgotEmail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setForgotStep('email'); setError(null); }}
                  className="text-[11px] text-[#1A1A1A] font-semibold underline cursor-pointer hover:text-indigo-600"
                >
                  Change
                </button>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Inbox className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  Please check your inbox or spam folder for the 6-digit password reset code sent to <span className="font-semibold text-amber-950">{forgotEmail}</span>.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Enter 6-Digit Reset Code <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1 2 3 4 5 6"
                    className="w-full pl-9.5 pr-3 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-sm font-mono font-bold tracking-widest text-center text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => handleSendForgotOtp()}
                  disabled={forgotCountdown > 0 || isSendingForgotOtp}
                  className="text-xs text-[#737373] hover:text-[#1A1A1A] disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSendingForgotOtp ? 'animate-spin' : ''}`} />
                  {forgotCountdown > 0 ? `Resend code in ${forgotCountdown}s` : 'Resend Reset Code'}
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setForgotStep('email'); setError(null); }}
                  className="py-2.5 px-3 bg-[#F0F0EC] hover:bg-[#E5E5E1] border border-[#E5E5E1] text-[#1A1A1A] rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingForgotOtp || forgotOtp.length < 4}
                  className="flex-1 py-2.5 px-4 bg-[#1A1A1A] hover:bg-[#2C2C2C] disabled:opacity-50 text-[#FCFCFA] text-xs font-semibold rounded-lg shadow-xs border border-[#1A1A1A] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifyingForgotOtp ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Reset Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FORGOT PASSWORD -> STEP 3 (NEW PASSWORD ENTRY) */}
          {/* ======================================================== */}
          {tab === 'forgot-password' && forgotStep === 'new-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">{forgotEmail}</p>
                    <p className="text-[11px] text-emerald-700">Code Verified Successfully</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
                  Authorized
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  New Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 4 characters"
                    className="w-full pl-9.5 pr-9 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#737373]" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                  Confirm New Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9.5 pr-9 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#737373]" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setForgotStep('otp')}
                  className="py-2.5 px-3 bg-[#F0F0EC] hover:bg-[#E5E5E1] border border-[#E5E5E1] text-[#1A1A1A] rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword || !newPassword || newPassword !== confirmPassword}
                  className="flex-1 py-2.5 px-4 bg-[#1A1A1A] hover:bg-[#2C2C2C] disabled:opacity-50 text-[#FCFCFA] text-xs font-semibold rounded-lg shadow-xs border border-[#1A1A1A] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isResettingPassword ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Save & Update Password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FORGOT PASSWORD -> STEP 4 (SUCCESS SCREEN) */}
          {/* ======================================================== */}
          {tab === 'forgot-password' && forgotStep === 'success' && (
            <div className="space-y-4 text-center py-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">Password Reset Complete!</h4>
                <p className="text-xs text-[#737373] mt-1 max-w-xs mx-auto">
                  Your password has been successfully updated. You can now sign in with your new credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEmail(forgotEmail);
                  switchTab('login');
                }}
                className="w-full py-2.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2C2C2C] text-[#FCFCFA] text-xs font-semibold shadow-xs border border-[#1A1A1A] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Privacy Policy Link */}
          <div className="pt-3 mt-4 border-t border-[#F0F0EC] text-center text-[11px] text-[#737373]">
            <span>By signing in or registering, you agree to our </span>
            <a
              id="auth-modal-privacy-policy-link"
              href="/privacy"
              onClick={(e) => {
                onClose();
                if (onNavigateToPrivacy) onNavigateToPrivacy(e);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Privacy Policy &amp; Google API Disclosure
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};
