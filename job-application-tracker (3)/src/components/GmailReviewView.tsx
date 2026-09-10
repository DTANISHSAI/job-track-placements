import React, { useState, useEffect } from 'react';
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Calendar,
  Building2,
  Briefcase,
  UserCheck,
  Code2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
  CheckCheck,
  Zap,
  HelpCircle,
  LogOut,
  PlusCircle,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GmailClassifiedEvent, GmailSyncSettings, GmailJobEventType, ApplicationStatus, JobApplication } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  requestGmailAccessToken,
  fetchGoogleUserProfile,
  fetchJobEmailsFromGmail,
  getStoredGmailToken,
  getStoredGmailEmail,
  clearStoredGmailToken
} from '../services/gmailClient';
import { googleSignInForGmail } from '../services/firebaseAuth';
interface GmailReviewViewProps {
  applications: JobApplication[];
  onApplicationUpdated: () => void;
  onNavigateToApplications?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const GmailReviewView: React.FC<GmailReviewViewProps> = ({
  applications,
  onApplicationUpdated,
  onNavigateToApplications,
  showToast: showToastProp,
}) => {
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (showToastProp) {
      showToastProp(msg, type === 'info' ? 'success' : type);
    } else {
      console.log(`[Toast ${type}]:`, msg);
    }
  };

  const [settings, setSettings] = useState<GmailSyncSettings>({
    autoSyncHighConfidence: false,
    minConfidenceThreshold: 0.9,
    isConnected: false,
    connectedEmail: '',
    totalEventsDetected: 0,
    pendingReviewCount: 0,
  });

  const [events, setEvents] = useState<GmailClassifiedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'high_confidence' | 'approved' | 'dismissed'>('pending');
  const [expandedSnippets, setExpandedSnippets] = useState<Record<string, boolean>>({});

  // Connect & Consent modal
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [showTestUserModal, setShowTestUserModal] = useState<boolean>(false);
  const [connectingAuth, setConnectingAuth] = useState<boolean>(false);

  // Edit & Apply modal
  const [editingEvent, setEditingEvent] = useState<GmailClassifiedEvent | null>(null);
  const [editCompany, setEditCompany] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('');
  const [editStatus, setEditStatus] = useState<ApplicationStatus>('Applied');
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editMeetingLink, setEditMeetingLink] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { user } = useAuth();

  // Load initial settings and events
  const loadData = async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [settingsRes, eventsRes] = await Promise.all([
        api.getGmailSettings(),
        api.getGmailEvents(),
      ]);

      if (settingsRes.success) {
        setSettings(settingsRes.settings);
      }
      if (eventsRes.success) {
        setEvents(eventsRes.events);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load Gmail sync data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setEvents([]);
      setSettings({
        autoSyncHighConfidence: false,
        minConfidenceThreshold: 0.9,
        isConnected: false,
        connectedEmail: '',
        totalEventsDetected: 0,
        pendingReviewCount: 0,
      });
      setLoading(false);
    }
  }, [user]);

  // Handle Toggle Auto-Sync Setting
  const handleToggleAutoSync = async (enabled: boolean) => {
    try {
      const res = await api.updateGmailSettings({ autoSyncHighConfidence: enabled });
      if (res.success) {
        setSettings(res.settings);
        showToast(
          enabled
            ? 'Auto-Sync enabled for high-confidence events (≥90%)'
            : 'Auto-Sync disabled. All events will require manual review.',
          'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update setting', 'error');
    }
  };

  // Connect Gmail with GIS Token client, falling back to Firebase Auth popup if needed
  const handleConnectGmail = async () => {
    try {
      setConnectingAuth(true);
      let token = '';
      let email = '';

      try {
        token = await requestGmailAccessToken();
        const profile = await fetchGoogleUserProfile(token);
        email = profile.email;
      } catch (gisError: any) {
        console.warn('GIS Token client request failed, checking error:', gisError);
        const gisMsg = gisError?.message || '';

        // Check if error is access restricted due to Google Cloud testing mode
        if (
          gisMsg.toLowerCase().includes('access denied') ||
          gisMsg.toLowerCase().includes('access_denied') ||
          gisMsg.toLowerCase().includes('test user') ||
          gisMsg.toLowerCase().includes('restricted') ||
          gisMsg.toLowerCase().includes('verification')
        ) {
          setShowConsentModal(false);
          setShowTestUserModal(true);
          return;
        }

        // Otherwise try Firebase Google Sign-In popup as fallback
        try {
          const fbResult = await googleSignInForGmail();
          token = fbResult.accessToken;
          email = fbResult.email || (user?.email || '');
        } catch (fbError: any) {
          const fbMsg = fbError?.message || '';
          if (
            fbMsg.toLowerCase().includes('access_denied') ||
            fbMsg.toLowerCase().includes('popup-closed-by-user') ||
            fbMsg.toLowerCase().includes('test')
          ) {
            setShowConsentModal(false);
            setShowTestUserModal(true);
            return;
          }
          throw gisError || fbError;
        }
      }

      if (!token) {
        throw new Error('No authorization token received from Google.');
      }

      const updateRes = await api.updateGmailSettings({
        isConnected: true,
        connectedEmail: email,
      });

      if (updateRes.success) {
        setSettings(updateRes.settings);
        setShowConsentModal(false);
        showToast(`Connected successfully as ${email}!`, 'success');
        // Trigger initial sync
        triggerSync(token, email);
      }
    } catch (err: any) {
      console.error('Failed to authenticate with Google:', err);
      const errMsg = err.message || '';
      if (
        errMsg.toLowerCase().includes('access denied') ||
        errMsg.toLowerCase().includes('access_denied') ||
        errMsg.toLowerCase().includes('test')
      ) {
        setShowConsentModal(false);
        setShowTestUserModal(true);
      } else {
        showToast(errMsg || 'Failed to authenticate with Google', 'error');
      }
    } finally {
      setConnectingAuth(false);
    }
  };

  // Disconnect Gmail
  const handleDisconnect = async () => {
    try {
      clearStoredGmailToken();
      const res = await api.disconnectGmail();
      if (res.success) {
        setSettings(res.settings);
        showToast('Gmail disconnected successfully.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to disconnect', 'error');
    }
  };

  // Trigger Sync from real Gmail account
  const triggerSync = async (tokenOverride?: string, emailOverride?: string) => {
    const token = tokenOverride || getStoredGmailToken();
    if (!token) {
      setShowConsentModal(true);
      return;
    }

    try {
      setSyncing(true);
      showToast('Scanning Gmail for job recruitment emails...', 'info');
      const messages = await fetchJobEmailsFromGmail(token, 20);

      if (messages.length === 0) {
        showToast('No new job-related emails detected in the last scan.', 'info');
        setSyncing(false);
        return;
      }

      const syncRes = await api.syncGmailBatch(messages, emailOverride || settings.connectedEmail);
      if (syncRes.success) {
        showToast(syncRes.message, 'success');
        onApplicationUpdated();
        loadData();
      }
    } catch (err: any) {
      if (
        err.message?.includes('expired') ||
        err.message?.includes('unauthorized') ||
        err.message?.includes('401') ||
        err.message?.includes('403') ||
        err.message?.includes('permission') ||
        err.message?.includes('scope')
      ) {
        clearStoredGmailToken();
        setShowConsentModal(true);
      }
      showToast(err.message || 'Error scanning Gmail messages', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Approve single event
  const handleApproveEvent = async (event: GmailClassifiedEvent) => {
    try {
      setActionLoadingId(event.id);
      const res = await api.applyGmailEvent(event.id);
      if (res.success) {
        showToast(res.message, 'success');
        onApplicationUpdated();
        // Update local list
        setEvents(prev => prev.map(e => e.id === event.id ? res.event : e));
        setSettings(prev => ({
          ...prev,
          pendingReviewCount: Math.max(0, (prev.pendingReviewCount || 1) - 1),
        }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to apply update', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dismiss single event
  const handleDismissEvent = async (event: GmailClassifiedEvent) => {
    try {
      setActionLoadingId(event.id);
      const res = await api.dismissGmailEvent(event.id);
      if (res.success) {
        showToast('Event dismissed.', 'info');
        setEvents(prev => prev.map(e => e.id === event.id ? res.event : e));
        setSettings(prev => ({
          ...prev,
          pendingReviewCount: Math.max(0, (prev.pendingReviewCount || 1) - 1),
        }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to dismiss', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Batch approve all high-confidence
  const handleApproveAllHighConfidence = async () => {
    try {
      setSyncing(true);
      const res = await api.approveAllHighConfidenceGmailEvents();
      if (res.success) {
        showToast(res.message, 'success');
        onApplicationUpdated();
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to approve events', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Open Edit modal
  const handleOpenEditModal = (event: GmailClassifiedEvent) => {
    setEditingEvent(event);
    setEditCompany(event.companyName);
    setEditRole(event.jobTitle);
    setEditStatus(event.proposedStatus || 'Applied');
    setEditDate(event.interviewDate || new Date().toISOString().slice(0, 10));
    setEditTime(event.interviewTime || '11:00');
    setEditMeetingLink(event.meetingLink || '');
  };

  // Submit Edit & Apply
  const handleSubmitEdit = async () => {
    if (!editingEvent) return;
    try {
      setActionLoadingId(editingEvent.id);
      const res = await api.applyGmailEvent(editingEvent.id, {
        companyName: editCompany.trim(),
        jobTitle: editRole.trim(),
        status: editStatus,
        interviewDate: editDate,
        interviewTime: editTime,
        meetingLink: editMeetingLink.trim(),
      });
      if (res.success) {
        showToast(res.message, 'success');
        onApplicationUpdated();
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? res.event : e));
        setEditingEvent(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to apply custom update', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtering events
  const filteredEvents = events.filter(event => {
    if (activeTab === 'pending') {
      return event.reviewStatus === 'PENDING_REVIEW' && event.isJobRelated;
    }
    if (activeTab === 'high_confidence') {
      return event.confidence >= 0.90 && event.isJobRelated;
    }
    if (activeTab === 'approved') {
      return event.reviewStatus === 'APPROVED' || event.reviewStatus === 'AUTO_APPLIED';
    }
    if (activeTab === 'dismissed') {
      return event.reviewStatus === 'DISMISSED';
    }
    return true;
  });

  const pendingCount = events.filter(e => e.reviewStatus === 'PENDING_REVIEW' && e.isJobRelated).length;
  const highConfidencePendingCount = events.filter(e => e.reviewStatus === 'PENDING_REVIEW' && e.confidence >= 0.90 && e.isJobRelated).length;

  const getEventTypeBadge = (type: GmailJobEventType) => {
    switch (type) {
      case 'INTERVIEW_INVITATION':
      case 'INTERVIEW_RESCHEDULED':
        return { label: 'Interview Invitation', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Calendar };
      case 'OFFER':
        return { label: 'Offer Letter', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Sparkles };
      case 'REJECTION':
        return { label: 'Application Rejection', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle };
      case 'ASSESSMENT':
        return { label: 'Online Assessment (OA)', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Code2 };
      case 'APPLICATION_SUBMITTED':
      case 'APPLICATION_RECEIVED':
        return { label: 'Application Received', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Briefcase };
      case 'SCREENING':
        return { label: 'HR Screening', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: UserCheck };
      default:
        return { label: type.replace(/_/g, ' '), bg: 'bg-zinc-100 text-zinc-700 border-zinc-200', icon: Mail };
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E1] p-12 text-center space-y-4">
        <Mail className="w-12 h-12 text-[#A3A3A3] mx-auto" />
        <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">Sign In Required</h3>
        <p className="text-xs text-[#737373]">Please sign in or register to connect Gmail and scan recruitment emails.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Control Bar */}
      <div className="bg-white border border-[#EBEBEA] rounded-2xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                <Mail className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-semibold text-[#1A1A1A]">
                Gmail Job Email Detection & Sync
              </h1>
            </div>
            <p className="text-sm text-[#737373]">
              AI monitors your recruitment communications from LinkedIn, Indeed, Greenhouse, and career portals to keep your tracker up to date.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {settings.isConnected ? (
              <button
                id="btn-sync-gmail"
                onClick={() => triggerSync()}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Scanning Inbox...' : 'Sync from Gmail'}
              </button>
            ) : (
              <button
                id="btn-connect-gmail"
                onClick={() => setShowConsentModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                Connect Gmail
              </button>
            )}

            {highConfidencePendingCount > 0 && (
              <button
                id="btn-approve-high-conf"
                onClick={handleApproveAllHighConfidence}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Approve High-Confidence ({highConfidencePendingCount})
              </button>
            )}
          </div>
        </div>

        {/* Connection & Auto-Sync Settings Panel */}
        <div className="mt-5 pt-4 border-t border-[#F0F0EE] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            {settings.isConnected ? (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Connected: <strong>{settings.connectedEmail || getStoredGmailEmail() || 'Active Google Account'}</strong></span>
                <button
                  onClick={handleDisconnect}
                  title="Disconnect Gmail"
                  className="ml-2 text-zinc-500 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
                <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                <span>Gmail not connected (Click 'Connect Gmail' to scan your mailbox)</span>
              </div>
            )}
            {settings.lastSyncedAt && (
              <span className="text-xs text-zinc-400 hidden sm:inline">
                Last scan: {new Date(settings.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Auto-Sync Toggle Control (Feature 19 Requirement: Default OFF) */}
          <div className="flex items-center gap-3 bg-[#F9F9F8] px-3.5 py-2 rounded-xl border border-[#EBEBEA]">
            <div className="text-left">
              <div className="text-xs font-medium text-[#1A1A1A] flex items-center gap-1.5">
                <span>Auto-sync high-confidence events (≥90%)</span>
                <span
                  title="When enabled, recruitment emails classified with ≥90% confidence will update your applications immediately without awaiting manual approval."
                  className="text-zinc-400 cursor-help"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-[#737373]">
                {settings.autoSyncHighConfidence ? 'Enabled: High-confidence changes apply automatically' : 'Disabled: All changes require manual approval'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSyncHighConfidence}
                onChange={(e) => handleToggleAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Tabs & Stats Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBEBEA] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="tab-pending"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'pending' ? 'bg-amber-400 text-black' : 'bg-amber-100 text-amber-800'}`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            id="tab-high-confidence"
            onClick={() => setActiveTab('high_confidence')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'high_confidence'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>High Confidence (≥90%)</span>
          </button>

          <button
            id="tab-approved"
            onClick={() => setActiveTab('approved')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approved & Synced</span>
          </button>

          <button
            id="tab-dismissed"
            onClick={() => setActiveTab('dismissed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dismissed'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Dismissed</span>
          </button>

          <button
            id="tab-all"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <span>All Detected ({events.length})</span>
          </button>
        </div>

        <div className="text-xs text-zinc-500 flex items-center gap-2">
          <span>Showing {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="bg-white border border-[#EBEBEA] rounded-2xl p-12 text-center text-zinc-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
          <p className="text-sm">Loading detected job emails...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white border border-[#EBEBEA] rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#1A1A1A]">No events found</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mt-1 mb-5">
            {activeTab === 'pending'
              ? 'All caught up! There are no pending recruitment emails to review.'
              : 'No job emails match the selected filter criteria.'}
          </p>
          <div className="flex justify-center gap-3">
            {settings.isConnected ? (
              <button
                onClick={() => triggerSync()}
                className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-black rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Scan Gmail Inbox
              </button>
            ) : (
              <button
                onClick={() => setShowConsentModal(true)}
                className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-black rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Connect Gmail
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredEvents.map((event) => {
              const badge = getEventTypeBadge(event.eventType);
              const isExpanded = !!expandedSnippets[event.id];
              const isHighConfidence = event.confidence >= 0.90;
              const isPending = event.reviewStatus === 'PENDING_REVIEW';
              const isApproved = event.reviewStatus === 'APPROVED' || event.reviewStatus === 'AUTO_APPLIED';
              const isDismissed = event.reviewStatus === 'DISMISSED';
              const isActing = actionLoadingId === event.id;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                    isPending
                      ? isHighConfidence
                        ? 'border-amber-200 ring-1 ring-amber-100 hover:border-amber-300'
                        : 'border-[#EBEBEA] hover:border-zinc-300'
                      : isApproved
                      ? 'border-emerald-200 bg-emerald-50/15'
                      : 'border-zinc-200 opacity-75'
                  }`}
                >
                  {/* Card Top: Company, Role, Event Type Badge, Confidence */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-[#1A1A1A] flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-zinc-500" />
                          {event.companyName}
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-sm font-medium text-zinc-700 flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                          {event.jobTitle}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        From: <span className="font-medium text-zinc-700">{event.from}</span> • {new Date(event.receivedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start">
                      {/* Event Type Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${badge.bg}`}>
                        <badge.icon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>

                      {/* Confidence Score Badge */}
                      <span
                        title={`AI Confidence: ${Math.round(event.confidence * 100)}%`}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          isHighConfidence
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {Math.round(event.confidence * 100)}% Confidence
                      </span>
                    </div>
                  </div>

                  {/* Subject & Snippet block */}
                  <div className="mt-3.5 bg-[#F9F9F8] rounded-xl p-3 border border-[#EBEBEA] space-y-1.5">
                    <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      Subject: {event.subject}
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                      {isExpanded ? event.snippet : `${event.snippet.slice(0, 180)}${event.snippet.length > 180 ? '...' : ''}`}
                    </p>
                    {event.snippet.length > 180 && (
                      <button
                        onClick={() => setExpandedSnippets(prev => ({ ...prev, [event.id]: !isExpanded }))}
                        className="text-[11px] font-medium text-zinc-600 hover:text-black flex items-center gap-0.5 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>Show less <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>Read full email snippet <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Detected Details Grid (Interview date, Recruiter, Links) */}
                  {(event.interviewDate || event.recruiterName || event.meetingLink || event.assessmentDeadline) && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {event.interviewDate && (
                        <div className="bg-purple-50/70 border border-purple-100 rounded-lg p-2 text-purple-900">
                          <span className="text-[10px] uppercase font-bold text-purple-600 block">Interview Schedule</span>
                          <span className="font-semibold">{event.interviewDate}</span>
                          {event.interviewTime && <span className="ml-1 text-purple-700">at {event.interviewTime}</span>}
                        </div>
                      )}
                      {event.recruiterName && (
                        <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2 text-blue-900">
                          <span className="text-[10px] uppercase font-bold text-blue-600 block">Recruiter / Contact</span>
                          <span className="font-semibold">{event.recruiterName}</span>
                          {event.recruiterEmail && <span className="text-[11px] text-blue-700 block truncate">{event.recruiterEmail}</span>}
                        </div>
                      )}
                      {event.meetingLink && (
                        <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-2 text-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Meeting Link</span>
                          <a
                            href={event.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-blue-600 hover:underline flex items-center gap-1 truncate"
                          >
                            <span>Open Platform Link</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                      {event.assessmentDeadline && (
                        <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-2 text-amber-900">
                          <span className="text-[10px] uppercase font-bold text-amber-700 block">OA Deadline</span>
                          <span className="font-semibold">{event.assessmentDeadline}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Proposed Action Box (Feature 18 & 19 Requirement) */}
                  <div className="mt-4 pt-3.5 border-t border-[#F0F0EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Proposed Action:</span>
                        {event.proposedAction === 'CREATE_JOB' && (
                          <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Create New Job ({event.proposedStatus || 'Applied'})
                          </span>
                        )}
                        {event.proposedAction === 'UPDATE_STATUS' && (
                          <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Update Status: {event.currentApplicationStatus || 'Applied'} → {event.proposedStatus}
                          </span>
                        )}
                        {event.proposedAction === 'SCHEDULE_INTERVIEW' && (
                          <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Update to Interview + Schedule Round
                          </span>
                        )}
                        {event.proposedAction === 'NO_ACTION' && (
                          <span className="text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                            Already Recorded (No Action Needed)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">{event.explanation}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <>
                          <button
                            id={`btn-approve-${event.id}`}
                            onClick={() => handleApproveEvent(event)}
                            disabled={isActing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isActing ? 'Applying...' : 'Approve & Sync'}
                          </button>

                          <button
                            id={`btn-edit-${event.id}`}
                            onClick={() => handleOpenEditModal(event)}
                            disabled={isActing}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          <button
                            id={`btn-dismiss-${event.id}`}
                            onClick={() => handleDismissEvent(event)}
                            disabled={isActing}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Dismiss
                          </button>
                        </>
                      ) : isApproved ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {event.reviewStatus === 'AUTO_APPLIED' ? 'Auto-Synchronized' : 'Approved & Synced'}
                          </span>
                          {onNavigateToApplications && (
                            <button
                              onClick={onNavigateToApplications}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <span>View Tracker</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">
                          <XCircle className="w-3.5 h-3.5" />
                          Dismissed
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Consent & Connect Gmail Modal */}
      <AnimatePresence>
        {showConsentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                  <Mail className="w-7 h-7" />
                </div>
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">
                  Connect Your Gmail Account
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Each user can connect their own Gmail account to detect and sync job recruitment emails automatically.
                </p>
              </div>

              <div className="bg-[#F9F9F8] border border-[#EBEBEA] rounded-xl p-3.5 text-xs text-zinc-700 space-y-2">
                <div className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Privacy &amp; Permissions Notice:
                </div>
                <ul className="list-disc list-inside space-y-1 text-zinc-600 text-[11px] leading-relaxed">
                  <li>Requests <code>gmail.readonly</code> scope to scan recruitment emails.</li>
                  <li>Filters exclusively for emails from LinkedIn, Indeed, Greenhouse, and company recruiters.</li>
                  <li>Does NOT read personal emails, cannot send emails, and cannot delete any messages.</li>
                  <li>Tokens are processed securely and can be disconnected anytime.</li>
                </ul>
                <div className="pt-1.5 border-t border-zinc-200/60 text-[11px] text-zinc-500">
                  Read our full{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 font-semibold underline inline-flex items-center gap-0.5 hover:text-indigo-800"
                  >
                    Privacy Policy &amp; Google Limited Use Statement
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-proceed-oauth"
                  onClick={handleConnectGmail}
                  disabled={connectingAuth}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {connectingAuth ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Authenticating with Google...
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      Grant Permission & Connect
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google OAuth Test User Info Modal */}
      <AnimatePresence>
        {showTestUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 text-left"
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Google OAuth Notice</span>
                </div>
                <button
                  onClick={() => setShowTestUserModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
                  Google OAuth 'Test User' Access Required
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Google restricts real mailbox access for unverified OAuth apps in <strong>Testing mode</strong> to the project owner (<code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700 font-mono">dtanishsai@gmail.com</code>) and designated <strong>Test Users</strong>.
                </p>
              </div>

              <div className="bg-[#F9F9F8] border border-[#EBEBEA] rounded-xl p-3.5 text-xs text-zinc-700 space-y-2">
                <div className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  How to authorize other student emails:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-600 text-[11px] leading-relaxed">
                  <li>Go to <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noreferrer" className="text-indigo-600 underline inline-flex items-center gap-0.5">console.cloud.google.com <ExternalLink className="w-2.5 h-2.5" /></a>).</li>
                  <li>Select Google Cloud project <code className="bg-white px-1 py-0.5 rounded border border-zinc-200 font-mono">gen-lang-client-0650371720</code>.</li>
                  <li>Navigate to <strong>APIs &amp; Services &gt; OAuth consent screen &gt; Audience &gt; Test users</strong>.</li>
                  <li>Click <strong>+ ADD USERS</strong> and add the student&apos;s email address.</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium inline-flex items-center gap-1"
                >
                  <span>Privacy Policy</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setShowTestUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit & Apply Custom Modal */}
      <AnimatePresence>
        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1A1A1A]">
                      Edit & Apply Event to Tracker
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Customize extracted company, role, or interview date before applying.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Job Title / Role</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Target Application Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ApplicationStatus)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Assessment">Online Assessment (OA)</option>
                    <option value="Interview">Technical / HR Interview</option>
                    <option value="Selected">Selected / Offer Received</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {(editStatus === 'Interview' || editingEvent.eventType === 'INTERVIEW_INVITATION') && (
                  <div className="pt-2 border-t border-zinc-100 space-y-2.5">
                    <span className="font-semibold text-zinc-800 block">Interview Details</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-zinc-500 mb-1">Interview Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-500 mb-1">Time</label>
                        <input
                          type="text"
                          value={editTime}
                          placeholder="e.g. 11:00 AM"
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Meeting Link / Platform</label>
                      <input
                        type="url"
                        value={editMeetingLink}
                        placeholder="https://meet.google.com/... or Teams / Zoom"
                        onChange={(e) => setEditMeetingLink(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEdit}
                  disabled={actionLoadingId === editingEvent.id}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-black transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save & Apply to Tracker
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
