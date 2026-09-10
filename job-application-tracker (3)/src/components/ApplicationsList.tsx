import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Building2, 
  Calendar, 
  IndianRupee, 
  MapPin, 
  Briefcase, 
  Edit3, 
  Trash2, 
  CalendarClock, 
  ExternalLink, 
  ChevronDown, 
  Check, 
  ArrowUpDown, 
  SlidersHorizontal,
  Plus,
  Trophy,
  History
} from 'lucide-react';
import { JobApplication, ApplicationStatus, JobType, FilterOptions } from '../types';
import confetti from 'canvas-confetti';

interface ApplicationsListProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string, company: string) => void;
  onScheduleInterview: (appId: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onOpenAddModal: () => void;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  Applied: { label: 'Applied', bg: 'bg-[#F0F0EC]', text: 'text-[#1A1A1A]', border: 'border-[#D4D4D0]', dot: 'bg-[#525252]' },
  Assessment: { label: 'Assessment', bg: 'bg-[#F2EEF5]', text: 'text-[#58327A]', border: 'border-[#DDD4E6]', dot: 'bg-[#58327A]' },
  Interview: { label: 'Interview', bg: 'bg-[#FBF4E8]', text: 'text-[#87550E]', border: 'border-[#F0DFBE]', dot: 'bg-[#87550E]' },
  Selected: { label: 'Selected (Offer)', bg: 'bg-[#EEF6F0]', text: 'text-[#1B6437]', border: 'border-[#C9E6D1]', dot: 'bg-[#1B6437]' },
  Rejected: { label: 'Rejected', bg: 'bg-[#F7F7F6]', text: 'text-[#8C8C88]', border: 'border-[#E5E5E1]', dot: 'bg-[#A3A39E]' },
};

export const ApplicationsList: React.FC<ApplicationsListProps> = ({
  applications,
  onEdit,
  onDelete,
  onScheduleInterview,
  onStatusChange,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [jobTypeFilter, setJobTypeFilter] = useState<JobType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'package-desc' | 'package-asc' | 'company-asc'>('date-desc');
  const [activeStatusMenu, setActiveStatusMenu] = useState<string | null>(null);
  const [historyModalApp, setHistoryModalApp] = useState<JobApplication | null>(null);

  // Filter and sort logic
  const filteredApps = applications.filter((app) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCompany = app.company.toLowerCase().includes(q);
      const matchRole不易 = app.role.toLowerCase().includes(q);
      const matchLocation = app.location.toLowerCase().includes(q);
      const matchNotes = app.notes ? app.notes.toLowerCase().includes(q) : false;
      if (!matchCompany && !matchRole不易 && !matchLocation && !matchNotes) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'All' && app.status !== statusFilter) {
      return false;
    }

    // Job Type filter
    if (jobTypeFilter !== 'All' && app.jobType !== jobTypeFilter) {
      return false;
    }

    return true;
  });

  // Sort
  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime();
    }
    if (sortBy === 'package-desc') {
      return (b.packageLPA || 0) - (a.packageLPA || 0);
    }
    if (sortBy === 'package-asc') {
      return (a.packageLPA || 0) - (b.packageLPA || 0);
    }
    if (sortBy === 'company-asc') {
      return a.company.localeCompare(b.company);
    }
    return 0;
  });

  const handleQuickStatusChange = (appId: string, status: ApplicationStatus) => {
    if (status === 'Selected') {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }
    onStatusChange(appId, status);
    setActiveStatusMenu(null);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E5E1] shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737373]">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="search-applications-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, roles, locations (e.g. Google, SDE, Bengaluru)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FCFCFA] border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] focus:border-[#1A1A1A] transition-all placeholder:text-[#A3A39E]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#737373] hover:text-[#1A1A1A]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort & Job Type Dropdowns */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Job Type */}
            <select
              id="filter-job-type"
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#FCFCFA] border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
            >
              <option value="All">All Job Types</option>
              <option value="Full Time">Full Time (FTE)</option>
              <option value="Internship">Internship</option>
              <option value="6M Intern + FTE">6M Intern + FTE</option>
              <option value="Contract">Contract</option>
            </select>

            {/* Sort */}
            <select
              id="sort-applications-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-[#FCFCFA] border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
            >
              <option value="date-desc">Newest Applied First</option>
              <option value="date-asc">Oldest Applied First</option>
              <option value="package-desc">Package: Highest to Lowest</option>
              <option value="package-asc">Package: Lowest to Highest</option>
              <option value="company-asc">Company Name (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
          <span className="text-[10px] font-semibold text-[#737373] uppercase tracking-widest mr-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>

          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'All'
                ? 'bg-[#1A1A1A] text-[#FCFCFA] font-semibold'
                : 'bg-[#F0F0EC] text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            All ({applications.length})
          </button>

          {(['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected'] as ApplicationStatus[]).map((status) => {
            const count = applications.filter(a => a.status === status).length;
            const isSelected = statusFilter === status;
            const cfg = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  isSelected
                    ? `${cfg.bg} ${cfg.text} border ${cfg.border} font-semibold shadow-xs`
                    : 'bg-[#F0F0EC] text-[#737373] hover:text-[#1A1A1A]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                <span>{cfg.label}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications List Count & Summary */}
      <div className="flex items-center justify-between px-1 text-xs text-[#737373]">
        <span>Showing <strong className="text-[#1A1A1A] font-semibold">{sortedApps.length}</strong> of {applications.length} recorded application{applications.length === 1 ? '' : 's'}</span>
        {statusFilter !== 'All' && (
          <button 
            onClick={() => setStatusFilter('All')}
            className="text-[#1A1A1A] font-semibold underline hover:text-black cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Applications Cards Grid */}
      {sortedApps.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-[#E5E5E1] text-center">
          <div className="w-12 h-12 rounded-lg bg-[#F0F0EC] text-[#1A1A1A] border border-[#E5E5E1] flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">No applications found</h3>
          <p className="text-xs text-[#737373] max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search criteria or clear status filters to view records.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#FCFCFA] bg-[#1A1A1A] hover:bg-[#2C2C2C] px-4 py-2 rounded-lg border border-[#1A1A1A] shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Placement Record</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedApps.map((app) => {
            const statusCfg = STATUS_CONFIG[app.status];
            const isMenuOpen判定 = activeStatusMenu === app.id;

            return (
              <div
                key={app.id}
                id={`application-card-${app.id}`}
                className="bg-white rounded-xl p-5 border border-[#E5E5E1] shadow-xs hover:border-[#1A1A1A] transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Header: Company Avatar & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] text-[#FCFCFA] font-serif font-bold text-sm flex items-center justify-center border border-[#1A1A1A]">
                        {app.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-serif text-lg font-semibold text-[#1A1A1A] leading-snug group-hover:text-black transition-colors">
                          {app.company}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-[#737373] font-normal">
                          <MapPin className="w-3 h-3 text-[#A3A39E]" />
                          <span className="truncate max-w-[130px]">{app.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Package Badge */}
                    <div className="text-right">
                      <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[#F0F0EC] border border-[#E5E5E1] text-[#1A1A1A] font-semibold text-xs">
                        <span>₹{app.packageLPA > 0 ? `${app.packageLPA} LPA` : 'Undisclosed'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role & Job Type */}
                  <div className="mt-3.5">
                    <div className="font-medium text-[#1A1A1A] text-sm">{app.role}</div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-medium text-[#525252] bg-[#F0F0EC] px-2 py-0.5 rounded border border-[#E5E5E1]">
                        {app.jobType}
                      </span>
                      <span className="text-[10px] text-[#737373] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#A3A39E]" />
                        {formatShortDate(app.applicationDate)}
                      </span>
                    </div>
                  </div>

                  {/* Status Selector Dropdown */}
                  <div className="mt-4 pt-3 border-t border-[#E5E5E1] relative">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#737373] font-medium text-[11px]">Recruitment Stage:</span>
                      
                      <div className="relative">
                        <button
                          onClick={() => setActiveStatusMenu(isMenuOpen判定 ? null : app.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all cursor-pointer ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
                          <span>{statusCfg.label}</span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>

                        {/* Quick Status Dropdown Menu */}
                        {isMenuOpen判定 && (
                          <div 
                            className="absolute right-0 bottom-full mb-1.5 w-44 bg-[#FCFCFA] rounded-xl shadow-xl border border-[#E5E5E1] py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#737373] border-b border-[#E5E5E1] mb-1">
                              Update Stage
                            </div>
                            {(['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected'] as ApplicationStatus[]).map((st) => (
                              <button
                                key={st}
                                onClick={() => handleQuickStatusChange(app.id, st)}
                                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#F0F0EC] transition-colors cursor-pointer ${
                                  app.status === st ? 'font-semibold text-[#1A1A1A] bg-[#F0F0EC]' : 'text-[#525252]'
                                }`}
                              >
                                <span>{st}</span>
                                {app.status === st && <Check className="w-3.5 h-3.5 text-[#1A1A1A]" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upcoming Interview alert pill if present */}
                    {app.upcomingInterview && (
                      <div className="mt-2.5 p-2.5 bg-[#FBF4E8] rounded-lg border border-[#F0DFBE] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs min-w-0">
                          <CalendarClock className="w-4 h-4 text-[#87550E] flex-shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-[#87550E]">{app.upcomingInterview.roundType}: </span>
                            <span className="text-[#87550E]">{formatShortDate(app.upcomingInterview.date)} {app.upcomingInterview.time}</span>
                          </div>
                        </div>
                        {app.upcomingInterview.meetingLink && (
                          <a
                            href={app.upcomingInterview.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-[#87550E] hover:text-black underline flex-shrink-0"
                          >
                            Link
                          </a>
                        )}
                      </div>
                    )}

                    {/* Notes preview if present */}
                    {app.notes && (
                      <p className="mt-2 text-xs text-[#737373] line-clamp-1 italic font-serif">
                        "{app.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="mt-4 pt-3 border-t border-[#E5E5E1] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {app.jobLink && (
                      <a
                        href={app.jobLink.startsWith('http') ? app.jobLink : `https://${app.jobLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-md text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors"
                        title="Open Job Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    
                    <button
                      onClick={() => setHistoryModalApp(app)}
                      className="p-1.5 rounded-md text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
                      title="View Timeline Logs"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onScheduleInterview(app.id)}
                      className="px-2.5 py-1.5 rounded-md bg-[#FBF4E8] hover:bg-[#F0DFBE] text-[#87550E] text-xs font-medium transition-colors flex items-center gap-1 border border-[#F0DFBE] cursor-pointer"
                      title="Schedule Interview"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Round</span>
                    </button>

                    <button
                      onClick={() => onEdit(app)}
                      className="p-1.5 rounded-md text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
                      title="Edit Application"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDelete(app.id, app.company)}
                      className="p-1.5 rounded-md text-[#A3A39E] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Application"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Application Status History Modal */}
      {historyModalApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FCFCFA] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5E1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#1A1A1A]" />
                <h4 className="font-serif text-base font-bold text-[#1A1A1A]">
                  {historyModalApp.company} — Status Timeline
                </h4>
              </div>
              <button
                onClick={() => setHistoryModalApp(null)}
                className="text-[#737373] hover:text-[#1A1A1A] text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {historyModalApp.history && historyModalApp.history.length > 0 ? (
                historyModalApp.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#1A1A1A] mt-1.5 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-[#1A1A1A]">{h.status}</div>
                      <div className="text-[#737373] text-[11px]">{formatShortDate(h.date)}</div>
                      {h.note && <div className="text-[#525252] mt-0.5 font-serif italic">{h.note}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#737373]">No previous status transitions recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatShortDate(dateStr: string): string {
  try {
    const d不易 = new Date(dateStr + 'T00:00:00');
    return d不易.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
