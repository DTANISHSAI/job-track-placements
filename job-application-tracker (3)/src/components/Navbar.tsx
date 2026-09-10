import React, { useState } from 'react';
import { 
  Briefcase, 
  LayoutDashboard, 
  ListFilter, 
  CalendarDays, 
  BarChart3, 
  Plus, 
  LogOut, 
  User as UserIcon, 
  GraduationCap,
  Sparkles,
  ChevronDown,
  Code2,
  Award,
  FileText,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'dashboard' | 'applications' | 'interviews' | 'resumes' | 'analytics' | 'profile' | 'gmail';
  setActiveTab: (tab: 'dashboard' | 'applications' | 'interviews' | 'resumes' | 'analytics' | 'profile' | 'gmail') => void;
  onOpenAddModal: () => void;
  onOpenAuthModal: () => void;
  onOpenProfile: () => void;
  onNavigateToPrivacy?: (e?: React.MouseEvent) => void;
  applicationsCount: number;
  upcomingInterviewsCount: number;
  gmailPendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenAuthModal,
  onOpenProfile,
  onNavigateToPrivacy,
  applicationsCount,
  upcomingInterviewsCount,
  gmailPendingCount,
}) => {
  const { user, isAuthenticated, logout, loginAsDemo } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#FCFCFA]/95 backdrop-blur-md border-b border-[#E5E5E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              id="brand-logo-button"
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-[#FCFCFA] border border-[#1A1A1A] group-hover:bg-[#2C2C2C] transition-colors">
                <Briefcase className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-[#1A1A1A] text-xl tracking-tight leading-none">JobTrack</span>
                  <span className="text-[10px] uppercase font-semibold tracking-widest px-1.5 py-0.5 rounded bg-[#F0F0EC] text-[#525252] border border-[#E5E5E1]">Placements</span>
                </div>
                <p className="text-[11px] text-[#737373] hidden sm:block font-normal tracking-tight">Personal Placement Portal</p>
              </div>
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F0F0EC] p-1 rounded-lg border border-[#E5E5E1]">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold shadow-xs'
                  : 'text-[#525252] hover:text-[#1A1A1A] hover:bg-white/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-tab-applications"
              onClick={() => setActiveTab('applications')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'applications'
                  ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold shadow-xs'
                  : 'text-[#525252] hover:text-[#1A1A1A] hover:bg-white/60'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Applications</span>
              {applicationsCount > 0 && (
                <span className={`ml-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'applications' ? 'bg-[#333333] text-[#FCFCFA]' : 'bg-[#E5E5E1] text-[#525252]'
                }`}>
                  {applicationsCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-interviews"
              onClick={() => setActiveTab('interviews')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'interviews'
                  ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold shadow-xs'
                  : 'text-[#525252] hover:text-[#1A1A1A] hover:bg-white/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Interviews</span>
              {upcomingInterviewsCount > 0 && (
                <span className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'interviews' ? 'bg-[#87550E] text-white' : 'bg-[#FBF4E8] text-[#87550E] border border-[#F0DFBE]'
                }`}>
                  {upcomingInterviewsCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-resumes"
              onClick={() => setActiveTab('resumes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'resumes'
                  ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold shadow-xs'
                  : 'text-[#525252] hover:text-[#1A1A1A] hover:bg-white/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>

            <button
              id="nav-tab-gmail"
              onClick={() => setActiveTab('gmail')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'gmail'
                  ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold shadow-xs'
                  : 'text-[#525252] hover:text-[#1A1A1A] hover:bg-white/60'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-red-500" />
              <span>Gmail Sync</span>
              {typeof gmailPendingCount === 'number' && gmailPendingCount > 0 && (
                <span className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'gmail' ? 'bg-amber-400 text-black' : 'bg-amber-100 text-amber-800'
                }`}>
                  {gmailPendingCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold shadow-xs'
                  : 'text-[#525252] hover:text-[#1A1A1A] hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </nav>

          {/* User Profile / Auth Button */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  id="user-profile-menu-button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-lg border border-[#E5E5E1] bg-white hover:bg-[#F7F7F4] transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-[#1A1A1A] text-[#FCFCFA] flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
                  </div>
                  <div className="hidden lg:block text-xs">
                    <div className="font-semibold text-[#1A1A1A] truncate max-w-[120px]">{user.name}</div>
                    <div className="text-[#737373] text-[10px] truncate max-w-[120px]">{user.college || 'Student'}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#737373]" />
                </button>

                {profileMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-[#FCFCFA] rounded-xl shadow-xl border border-[#E5E5E1] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-[#E5E5E1]">
                      <div className="font-serif font-bold text-base text-[#1A1A1A]">{user.name}</div>
                      <div className="text-xs text-[#737373] truncate">{user.email}</div>
                      {user.college && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#525252] bg-[#F0F0EC] px-2 py-0.5 rounded border border-[#E5E5E1]">
                          <GraduationCap className="w-3 h-3 text-[#737373]" />
                          <span className="truncate">{user.college} ({user.graduationYear || '2026'})</span>
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#1A1A1A] font-medium hover:bg-[#F0F0EC] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>View Full Profile Page</span>
                      </button>
                      <button
                        onClick={onOpenProfile}
                        className="w-full text-left px-4 py-2 text-xs text-[#525252] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5 text-[#737373]" />
                        <span>Edit LeetCode & Badges</span>
                      </button>
                      <button
                        onClick={onOpenAuthModal}
                        className="w-full text-left px-4 py-2 text-xs text-[#525252] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-[#737373]" />
                        <span>Switch Student Account</span>
                      </button>
                      <button
                        onClick={loginAsDemo}
                        className="w-full text-left px-4 py-2 text-xs text-[#525252] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#87550E]" />
                        <span>Load Sample Student Data</span>
                      </button>
                      <a
                        id="nav-profile-privacy-policy"
                        href="/privacy"
                        onClick={(e) => {
                          setProfileMenuOpen(false);
                          if (onNavigateToPrivacy) onNavigateToPrivacy(e);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#525252] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#737373]" />
                        <span>Privacy Policy</span>
                      </a>
                    </div>

                    <div className="border-t border-[#E5E5E1] pt-1">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setActiveTab('dashboard');
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  id="nav-header-privacy-link"
                  href="/privacy"
                  onClick={onNavigateToPrivacy}
                  className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Privacy</span>
                </a>
                <button
                  id="btn-login-header"
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FCFCFA] bg-[#1A1A1A] hover:bg-[#2C2C2C] rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-[#E5E5E1] overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold' : 'text-[#737373]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 cursor-pointer ${
              activeTab === 'applications' ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold' : 'text-[#737373]'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Apps ({applicationsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('interviews')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 cursor-pointer ${
              activeTab === 'interviews' ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold' : 'text-[#737373]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Interviews</span>
          </button>

          <button
            onClick={() => setActiveTab('resumes')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 cursor-pointer ${
              activeTab === 'resumes' ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold' : 'text-[#737373]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume</span>
          </button>

          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 cursor-pointer ${
              activeTab === 'gmail' ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold' : 'text-[#737373]'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-red-500" />
            <span>Gmail</span>
            {typeof gmailPendingCount === 'number' && gmailPendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
