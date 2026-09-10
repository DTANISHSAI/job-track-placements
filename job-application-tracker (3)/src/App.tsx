import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  ListFilter, 
  Kanban, 
  CalendarDays, 
  BarChart3, 
  LayoutDashboard, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Search,
  IndianRupee,
  Briefcase,
  Lock
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { JobApplication, InterviewSchedule, DashboardStats, ApplicationStatus } from './types';
import { Navbar } from './components/Navbar';
import { DashboardStats as DashboardStatsComponent } from './components/DashboardStats';
import { UpcomingInterviews } from './components/UpcomingInterviews';
import { ApplicationsList } from './components/ApplicationsList';
import { KanbanBoard } from './components/KanbanBoard';
import { AnalyticsView } from './components/AnalyticsView';
import { ApplicationModal } from './components/ApplicationModal';
import { InterviewModal } from './components/InterviewModal';
import { AuthModal } from './components/AuthModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ProfileView } from './components/ProfileView';
import { ProfileModal } from './components/ProfileModal';
import { ResumeManagementView } from './components/ResumeManagementView';
import { GmailReviewView } from './components/GmailReviewView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';

function MainTrackerApp() {
  const { user, isAuthenticated, loginAsDemo } = useAuth();
  
  // URL Route State for Privacy Policy (accessible without requiring login)
  const [isPrivacyView, setIsPrivacyView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      return path === '/privacy' || path === '/privacy-policy' || hash === '#/privacy' || hash === '#privacy';
    }
    return false;
  });

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'interviews' | 'resumes' | 'analytics' | 'profile' | 'gmail'>('dashboard');
  const [applicationsViewMode, setApplicationsViewMode] = useState<'list' | 'kanban'>('list');

  // Data State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [gmailPendingCount, setGmailPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewTargetAppId, setInterviewTargetAppId] = useState<string | undefined>(undefined);
  const [editingInterview, setEditingInterview] = useState<InterviewSchedule | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; company: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Synchronize route changes for Privacy Policy
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      setIsPrivacyView(path === '/privacy' || path === '/privacy-policy' || hash === '#/privacy' || hash === '#privacy');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToPrivacy = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.history.pushState({}, '', '/privacy');
    setIsPrivacyView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.history.pushState({}, '', '/');
    setIsPrivacyView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Immediate data clearance upon logout
  useEffect(() => {
    if (!isAuthenticated) {
      setApplications([]);
      setInterviews([]);
      setStats(null);
      setGmailPendingCount(0);
      setEditingApp(null);
      setEditingInterview(null);
      setIsAppModalOpen(false);
      setIsInterviewModalOpen(false);
      setIsProfileModalOpen(false);
      setActiveTab('dashboard');
    }
  }, [isAuthenticated]);

  // Fetch all user data
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setApplications([]);
      setInterviews([]);
      setStats(null);
      setGmailPendingCount(0);
      setEditingApp(null);
      setEditingInterview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [appsRes, interviewsRes, statsRes, gmailSettingsRes] = await Promise.all([
        api.getApplications(),
        api.getInterviews(),
        api.getAnalytics(),
        api.getGmailSettings().catch(() => ({ success: false, settings: { pendingReviewCount: 0 } })),
      ]);
      setApplications(appsRes.applications || []);
      setInterviews(interviewsRes.interviews || []);
      setStats(statsRes.stats || null);
      if (gmailSettingsRes?.settings) {
        setGmailPendingCount(gmailSettingsRes.settings.pendingReviewCount || 0);
      }
    } catch (err: any) {
      console.error('Error loading tracker data:', err);
      showToast(err.message || 'Failed to fetch application data', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers for Applications
  const handleSaveApplication = async (appData: Partial<JobApplication>) => {
    try {
      if (editingApp) {
        const res = await api.updateApplication(editingApp.id, appData);
        showToast(`Updated application for ${res.application.company}!`);
      } else {
        const res = await api.createApplication(appData);
        showToast(`Added ${res.application.company} (${res.application.role}) to tracker!`);
      }
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save application', 'error');
      throw err;
    }
  };

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      const res = await api.updateApplicationStatus(id, newStatus);
      showToast(`Status updated to "${newStatus}" for ${res.application.company}`);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteApplication(deleteTarget.id);
      showToast(`Removed application for ${deleteTarget.company}`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete application', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handlers for Interviews
  const handleSaveInterview = async (interviewData: any) => {
    try {
      const res = await api.scheduleInterview(interviewData);
      showToast(`Scheduled ${interviewData.roundType} for ${res.application.company}!`);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule interview', 'error');
      throw err;
    }
  };

  const handleDeleteInterview = async (applicationId: string) => {
    try {
      const res = await api.deleteInterview(applicationId);
      showToast(`Removed scheduled interview for ${res.application.company}`);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove interview', 'error');
    }
  };

  // Reset demo dataset
  const handleResetData = async () => {
    try {
      await api.resetData();
      showToast('Sample placement dataset reloaded successfully!');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset data', 'error');
    }
  };

  const openAddModal = () => {
    setEditingApp(null);
    setIsAppModalOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setIsAppModalOpen(true);
  };

  const openScheduleModal = (appId?: string) => {
    setEditingInterview(null);
    setInterviewTargetAppId(appId);
    setIsInterviewModalOpen(true);
  };

  const openEditInterviewModal = (interview: InterviewSchedule) => {
    setEditingInterview(interview);
    setInterviewTargetAppId(interview.applicationId);
    setIsInterviewModalOpen(true);
  };

  const handleFilterFromStats = (status: ApplicationStatus | 'All') => {
    setActiveTab('applications');
  };

  const upcomingInterviewsCount = interviews.filter(i => !i.completed && new Date(`${i.date}T${i.time || '23:59'}`) >= new Date()).length;

  // Render standalone, publicly accessible Privacy Policy without requiring login
  if (isPrivacyView) {
    return (
      <div className="min-h-screen bg-[#FCFCFA] text-[#1A1A1A] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        <PrivacyPolicyView onBackToApp={navigateToHome} />
        <footer className="mt-auto border-t border-[#E5E5E1] bg-[#FCFCFA] py-5 text-center text-xs text-[#737373]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#1A1A1A]"></span>
              <span className="font-serif font-semibold text-[#1A1A1A]">JobTrack</span>
              <span className="text-[#A3A39E]">•</span>
              <span>Placement Application & Recruitment Ledger</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#8C8C88]">
              <a
                id="link-privacy-in-policy"
                href="/privacy"
                onClick={navigateToPrivacy}
                className="text-zinc-900 font-semibold underline underline-offset-2"
              >
                Privacy Policy
              </a>
              <span className="text-[#D4D4D0]">•</span>
              <span>Google API Services User Data Policy Compliant</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCFA] text-[#1A1A1A] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={openAddModal}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onNavigateToPrivacy={navigateToPrivacy}
        applicationsCount={applications.length}
        upcomingInterviewsCount={upcomingInterviewsCount}
        gmailPendingCount={gmailPendingCount}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold ${
            toastMessage.type === 'success' 
              ? 'bg-[#1A1A1A] text-[#FCFCFA] border border-[#333333]' 
              : 'bg-rose-900 text-rose-50 border border-rose-800'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-300" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {!isAuthenticated ? (
          <div className="max-w-2xl mx-auto my-10 bg-white rounded-2xl border border-[#E5E5E1] p-8 sm:p-10 shadow-xs space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F5F3] border border-[#E5E5E1] flex items-center justify-center text-[#1A1A1A]">
                <Briefcase className="w-6 h-6 stroke-[1.75]" />
              </div>
              
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F5F3] text-[#525252] text-[11px] font-semibold uppercase tracking-wider border border-[#E5E5E1]">
                  Placement Season 2026
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
                  Campus Placement & Job Tracker
                </h2>
                <p className="text-xs sm:text-sm text-[#737373] max-w-lg mx-auto leading-relaxed">
                  A centralized journal for students to manage campus placements, off-campus drives, technical interviews, ATS resumes, and real-time Gmail recruitment updates.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                <button
                  id="btn-signed-out-login"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1A1A1A] text-[#FCFCFA] text-xs font-semibold hover:bg-[#2C2C2C] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Sign In / Register</span>
                </button>

                <button
                  id="btn-signed-out-demo"
                  onClick={loginAsDemo}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#F5F5F3] text-[#1A1A1A] text-xs font-semibold hover:bg-[#EBEBE8] border border-[#E5E5E1] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Load Sample Data / Demo Account</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0F0EC] grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#EBEBE8] space-y-1">
                <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Placement Drives & CTC
                </div>
                <p className="text-[11px] text-[#737373] leading-relaxed">
                  Track company eligibility, compensation packages, OA rounds, and offer status.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#EBEBE8] space-y-1">
                <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  Interview Timelines
                </div>
                <p className="text-[11px] text-[#737373] leading-relaxed">
                  Keep track of technical rounds, meeting links, interviewers, and preparation notes.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#EBEBE8] space-y-1">
                <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  Resume ATS Scoring
                </div>
                <p className="text-[11px] text-[#737373] leading-relaxed">
                  Upload resumes and calculate real-time keyword match percentages against job descriptions.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#EBEBE8] space-y-1">
                <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                  Smart Gmail Sync
                </div>
                <p className="text-[11px] text-[#737373] leading-relaxed">
                  Automatically classify recruitment emails, detect test links, and update your ledger.
                </p>
              </div>
            </div>

            {/* Public Privacy Policy Link for Unauthenticated Users */}
            <div className="pt-4 border-t border-[#F0F0EC] text-center text-[11px] text-[#737373]">
              <span>We take your privacy seriously. Read our </span>
              <a
                id="link-welcome-card-privacy"
                href="/privacy"
                onClick={navigateToPrivacy}
                className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <span>Privacy Policy &amp; Google User Data Disclosure</span>
              </a>
            </div>
          </div>
        ) : loading && applications.length === 0 ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-white rounded-xl border border-[#E5E5E1]"></div>
              ))}
            </div>
            <div className="h-96 bg-white rounded-xl border border-[#E5E5E1]"></div>
          </div>
        ) : (
          <>
            {/* View 1: Dashboard Overview */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Editorial Welcome Header */}
                <div className="bg-[#1A1A1A] rounded-2xl p-6 sm:p-8 text-[#FCFCFA] shadow-sm border border-[#2C2C2C] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="relative z-10 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2C2C2C] text-[#D4D4D0] text-[10px] font-semibold uppercase tracking-widest border border-[#3E3E3E] mb-3">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Placement Ledger • Season 2026</span>
                    </div>
                    <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#FCFCFA] leading-tight">
                      Welcome, <span className="italic font-medium">{user?.name || 'Student'}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-[#A3A39E] mt-2 leading-relaxed">
                      You currently maintain <strong className="text-[#FCFCFA] font-medium">{applications.length} recorded application{applications.length === 1 ? '' : 's'}</strong>.
                      {upcomingInterviewsCount > 0 ? (
                        <span className="text-[#F0DFBE] ml-1 font-medium">
                          {upcomingInterviewsCount} interview round{upcomingInterviewsCount === 1 ? '' : 's'} pending this cycle.
                        </span>
                      ) : (
                        <span className="text-[#A3A39E] ml-1">
                          Track company drives, assessment stages, and placement offerings in one place.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center gap-3">
                    <button
                      id="btn-dashboard-add-application"
                      onClick={openAddModal}
                      className="flex items-center gap-2 bg-[#FCFCFA] hover:bg-[#F0F0EC] active:bg-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold px-4 py-2.5 rounded-lg shadow-none border border-[#FCFCFA] transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add Placement Application</span>
                    </button>

                    <button
                      id="btn-dashboard-view-all"
                      onClick={() => setActiveTab('applications')}
                      className="flex items-center gap-2 bg-[#2C2C2C] hover:bg-[#383838] text-[#FCFCFA] text-xs font-medium px-4 py-2.5 rounded-lg border border-[#3E3E3E] transition-colors cursor-pointer"
                    >
                      <ListFilter className="w-4 h-4 text-[#A3A39E]" />
                      <span>View Applications ({applications.length})</span>
                    </button>

                    <button
                      id="btn-dashboard-resumes"
                      onClick={() => setActiveTab('resumes')}
                      className="flex items-center gap-2 bg-[#2C2C2C] hover:bg-[#383838] text-[#FCFCFA] text-xs font-medium px-4 py-2.5 rounded-lg border border-[#3E3E3E] transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Resume</span>
                    </button>

                    <button
                      id="btn-dashboard-gmail"
                      onClick={() => setActiveTab('gmail')}
                      className="flex items-center gap-2 bg-[#2C2C2C] hover:bg-[#383838] text-[#FCFCFA] text-xs font-medium px-4 py-2.5 rounded-lg border border-[#3E3E3E] transition-colors cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      <span>Gmail Sync</span>
                      {gmailPendingCount > 0 && (
                        <span className="bg-amber-400 text-black font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                          {gmailPendingCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Dashboard Stats */}
                <DashboardStatsComponent
                  stats={stats}
                  onFilterByStatus={handleFilterFromStats}
                  onOpenAddModal={openAddModal}
                />

                {/* Upcoming Interviews Imminent Section */}
                <UpcomingInterviews
                  interviews={interviews}
                  onOpenScheduleModal={openScheduleModal}
                  onEditInterview={openEditInterviewModal}
                  onDeleteInterview={handleDeleteInterview}
                />

              </div>
            )}

            {/* View 2: Applications Tracker (List & Kanban View) */}
            {activeTab === 'applications' && (
              <div className="space-y-5">
                
                {/* Header with View Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E5E1] shadow-xs">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A] tracking-tight">Applications Registry</h2>
                    <p className="text-xs text-[#737373] mt-0.5">
                      Review company placement logs, salaries, CTC tiers, and recruitment pipeline status
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher: List vs Kanban */}
                    <div className="flex items-center bg-[#F0F0EC] p-1 rounded-lg border border-[#E5E5E1]">
                      <button
                        id="btn-view-list"
                        onClick={() => setApplicationsViewMode('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          applicationsViewMode === 'list'
                            ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold shadow-xs'
                            : 'text-[#737373] hover:text-[#1A1A1A]'
                        }`}
                      >
                        <ListFilter className="w-3.5 h-3.5" />
                        <span>Grid / List</span>
                      </button>

                      <button
                        id="btn-view-kanban"
                        onClick={() => setApplicationsViewMode('kanban')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          applicationsViewMode === 'kanban'
                            ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold shadow-xs'
                            : 'text-[#737373] hover:text-[#1A1A1A]'
                        }`}
                      >
                        <Kanban className="w-3.5 h-3.5" />
                        <span>Pipeline Kanban</span>
                      </button>
                    </div>

                    <button
                      id="btn-add-app-tracker-view"
                      onClick={openAddModal}
                      className="flex items-center gap-1.5 bg-[#1A1A1A] hover:bg-[#2C2C2C] text-[#FCFCFA] text-xs font-semibold px-3.5 py-2 rounded-lg border border-[#1A1A1A] shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>New Application</span>
                    </button>
                  </div>
                </div>

                {/* Content according to view mode */}
                {applicationsViewMode === 'list' ? (
                  <ApplicationsList
                    applications={applications}
                    onEdit={openEditModal}
                    onDelete={(id, company) => setDeleteTarget({ id, company })}
                    onScheduleInterview={openScheduleModal}
                    onStatusChange={handleStatusChange}
                    onOpenAddModal={openAddModal}
                  />
                ) : (
                  <KanbanBoard
                    applications={applications}
                    onStatusChange={handleStatusChange}
                    onEdit={openEditModal}
                    onScheduleInterview={openScheduleModal}
                    onOpenAddModal={openAddModal}
                  />
                )}

              </div>
            )}

            {/* View 3: Interviews Calendar & Schedules */}
            {activeTab === 'interviews' && (
              <UpcomingInterviews
                interviews={interviews}
                onOpenScheduleModal={openScheduleModal}
                onEditInterview={openEditInterviewModal}
                onDeleteInterview={handleDeleteInterview}
              />
            )}

            {/* View 4: Resume Management & AI Analyzer (Browser Only Storage) */}
            {activeTab === 'resumes' && (
              <ResumeManagementView
                showToast={showToast}
              />
            )}

            {/* View 5: Analytics & Insights */}
            {activeTab === 'analytics' && (
              <AnalyticsView
                applications={applications}
                stats={stats}
                onResetData={handleResetData}
              />
            )}

            {/* View 6: Gmail Job Email Detection & Sync Review */}
            {activeTab === 'gmail' && (
              <GmailReviewView
                applications={applications}
                onApplicationUpdated={fetchData}
                onNavigateToApplications={() => setActiveTab('applications')}
                showToast={showToast}
              />
            )}

            {/* View 7: Full Student Profile & Badges */}
            {activeTab === 'profile' && (
              <ProfileView
                onOpenEditModal={() => setIsProfileModalOpen(true)}
              />
            )}
          </>
        )}

      </main>

      {/* Modals */}
      <ApplicationModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        onSave={handleSaveApplication}
        initialData={editingApp}
      />

      <InterviewModal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        onSave={handleSaveInterview}
        applications={applications}
        initialApplicationId={interviewTargetAppId}
        initialInterview={editingInterview}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => fetchData()}
        onNavigateToPrivacy={navigateToPrivacy}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSuccess={() => fetchData()}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        companyName={deleteTarget?.company || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Editorial Footer */}
      <footer className="mt-auto border-t border-[#E5E5E1] bg-[#FCFCFA] py-5 text-center text-xs text-[#737373]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#1A1A1A]"></span>
            <span className="font-serif font-semibold text-[#1A1A1A]">JobTrack</span>
            <span className="text-[#A3A39E]">•</span>
            <span>Placement Application &amp; Recruitment Ledger</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#8C8C88]">
            <a
              id="link-footer-privacy"
              href="/privacy"
              onClick={navigateToPrivacy}
              className="text-zinc-600 hover:text-black font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <span className="text-[#D4D4D0]">•</span>
            <span>Full-Stack Node/Express API Architecture &amp; Local Persistence</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainTrackerApp />
    </AuthProvider>
  );
}
