import React from 'react';
import { 
  Briefcase, 
  FileCheck, 
  CalendarClock, 
  Trophy, 
  TrendingUp, 
  IndianRupee, 
  PieChart, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight 
} from 'lucide-react';
import { DashboardStats as StatsType, ApplicationStatus } from '../types';

interface DashboardStatsProps {
  stats: StatsType | null;
  onFilterByStatus?: (status: ApplicationStatus | 'All') => void;
  onOpenAddModal: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  onFilterByStatus,
  onOpenAddModal,
}) => {
  if (!stats) return null;

  const total = stats.totalApplications || 0;
  const appliedPct = total > 0 ? Math.round((stats.appliedCount / total) * 100) : 0;
  const assessPct = total > 0 ? Math.round((stats.assessmentCount / total) * 100) : 0;
  const interviewPct = total > 0 ? Math.round((stats.interviewCount / total) * 100) : 0;
  const selectedPct = total > 0 ? Math.round((stats.selectedCount / total) * 100) : 0;
  const rejectedPct = total > 0 ? Math.round((stats.rejectedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Main Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Total Applications */}
        <div 
          id="stat-card-total"
          onClick={() => onFilterByStatus && onFilterByStatus('All')}
          className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E5E1] shadow-xs hover:border-[#1A1A1A] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#737373] uppercase tracking-widest">Total Drives</span>
            <div className="w-8 h-8 rounded-lg bg-[#F0F0EC] group-hover:bg-[#1A1A1A] text-[#1A1A1A] group-hover:text-[#FCFCFA] flex items-center justify-center transition-colors">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1A1A]">{stats.totalApplications}</span>
            <span className="text-[11px] font-medium text-[#737373] flex items-center gap-0.5">
              Companies <ArrowUpRight className="w-3 h-3 text-[#A3A39E]" />
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#737373]">
            Campus drives & off-campus records
          </div>
        </div>

        {/* Assessment Stage */}
        <div 
          id="stat-card-assessment"
          onClick={() => onFilterByStatus && onFilterByStatus('Assessment')}
          className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E5E1] shadow-xs hover:border-[#58327A] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#58327A] uppercase tracking-widest">Assessments / OA</span>
            <div className="w-8 h-8 rounded-lg bg-[#F2EEF5] group-hover:bg-[#58327A] text-[#58327A] group-hover:text-white flex items-center justify-center transition-colors">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1A1A]">{stats.assessmentCount}</span>
            <span className="text-[10px] font-semibold text-[#58327A] bg-[#F2EEF5] border border-[#DDD4E6] px-2 py-0.5 rounded">
              {assessPct}% of total
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#737373]">
            Online coding tests & tasks
          </div>
        </div>

        {/* Interviews Active */}
        <div 
          id="stat-card-interviews"
          onClick={() => onFilterByStatus && onFilterByStatus('Interview')}
          className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E5E1] shadow-xs hover:border-[#87550E] transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#87550E] uppercase tracking-widest">Interviews</span>
            <div className="w-8 h-8 rounded-lg bg-[#FBF4E8] group-hover:bg-[#87550E] text-[#87550E] group-hover:text-white flex items-center justify-center transition-colors">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1A1A]">{stats.interviewCount}</span>
            <span className="text-[10px] font-semibold text-[#87550E] bg-[#FBF4E8] border border-[#F0DFBE] px-2 py-0.5 rounded">
              {stats.upcomingInterviewsCount} scheduled
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#737373]">
            Technical & HR discussions
          </div>
        </div>

        {/* Selected / Offers */}
        <div 
          id="stat-card-selected"
          onClick={() => onFilterByStatus && onFilterByStatus('Selected')}
          className="bg-[#F7FAF7] rounded-xl p-4 sm:p-5 border border-[#C9E6D1] shadow-xs hover:border-[#1B6437] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#1B6437] uppercase tracking-widest">Offers / Selected</span>
            <div className="w-8 h-8 rounded-lg bg-[#EEF6F0] text-[#1B6437] border border-[#C9E6D1] flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#1B6437]">{stats.selectedCount}</span>
            <span className="text-[10px] font-semibold text-[#1B6437] bg-[#EEF6F0] border border-[#C9E6D1] px-2 py-0.5 rounded flex items-center gap-1">
              {selectionRateString(stats.selectionRate)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#2B7A49] font-normal">
            Confirmed placement offers
          </div>
        </div>

      </div>

      {/* Financial & Conversion Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Highest Package */}
        <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#F0F0EC] text-[#1A1A1A] border border-[#E5E5E1] flex items-center justify-center flex-shrink-0 font-bold">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Highest CTC Package</div>
            <div className="font-serif text-xl sm:text-2xl font-normal text-[#1A1A1A]">
              {stats.highestPackage > 0 ? `₹${stats.highestPackage} LPA` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Average Package */}
        <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#F0F0EC] text-[#1A1A1A] border border-[#E5E5E1] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Average Package</div>
            <div className="font-serif text-xl sm:text-2xl font-normal text-[#1A1A1A]">
              {stats.averagePackage > 0 ? `₹${stats.averagePackage} LPA` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Response / Shortlist Rate */}
        <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#F0F0EC] text-[#1A1A1A] border border-[#E5E5E1] flex items-center justify-center flex-shrink-0">
            <PieChart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Shortlist / Response Rate</div>
            <div className="font-serif text-xl sm:text-2xl font-normal text-[#1A1A1A]">
              {stats.responseRate}%
            </div>
          </div>
        </div>

      </div>

      {/* Application Funnel & Status Distribution */}
      <div className="bg-white rounded-xl p-5 border border-[#E5E5E1] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <div>
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A] tracking-tight">Placement Pipeline Status</h3>
            <p className="text-xs text-[#737373]">Distribution of your {total} registered company applications</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#525252]">
              <span className="w-2 h-2 rounded-full bg-[#1A1A1A]"></span> Applied ({stats.appliedCount})
            </span>
            <span className="flex items-center gap-1.5 text-[#58327A]">
              <span className="w-2 h-2 rounded-full bg-[#58327A]"></span> Assessment ({stats.assessmentCount})
            </span>
            <span className="flex items-center gap-1.5 text-[#87550E]">
              <span className="w-2 h-2 rounded-full bg-[#87550E]"></span> Interview ({stats.interviewCount})
            </span>
            <span className="flex items-center gap-1.5 text-[#1B6437] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#1B6437]"></span> Selected ({stats.selectedCount})
            </span>
            <span className="flex items-center gap-1.5 text-[#8C8C88]">
              <span className="w-2 h-2 rounded-full bg-[#D4D4D0]"></span> Rejected ({stats.rejectedCount})
            </span>
          </div>
        </div>

        {/* Visual Progress Funnel Bar */}
        <div className="h-3 w-full bg-[#F0F0EC] rounded-md overflow-hidden flex gap-0.5 p-0.5">
          {stats.appliedCount > 0 && (
            <div 
              style={{ width: `${(stats.appliedCount / total) * 100}%` }} 
              className="bg-[#1A1A1A] h-full rounded-xs transition-all"
              title={`Applied: ${stats.appliedCount} (${appliedPct}%)`}
            />
          )}
          {stats.assessmentCount > 0 && (
            <div 
              style={{ width: `${(stats.assessmentCount / total) * 100}%` }} 
              className="bg-[#58327A] h-full rounded-xs transition-all"
              title={`Assessment: ${stats.assessmentCount} (${assessPct}%)`}
            />
          )}
          {stats.interviewCount > 0 && (
            <div 
              style={{ width: `${(stats.interviewCount / total) * 100}%` }} 
              className="bg-[#87550E] h-full rounded-xs transition-all"
              title={`Interview: ${stats.interviewCount} (${interviewPct}%)`}
            />
          )}
          {stats.selectedCount > 0 && (
            <div 
              style={{ width: `${(stats.selectedCount / total) * 100}%` }} 
              className="bg-[#1B6437] h-full rounded-xs transition-all"
              title={`Selected: ${stats.selectedCount} (${selectedPct}%)`}
            />
          )}
          {stats.rejectedCount > 0 && (
            <div 
              style={{ width: `${(stats.rejectedCount / total) * 100}%` }} 
              className="bg-[#D4D4D0] h-full rounded-xs transition-all"
              title={`Rejected: ${stats.rejectedCount} (${rejectedPct}%)`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function selectionRateString(rate: number): string {
  if (rate >= 20) return `${rate}% Success`;
  return `${rate}% Rate`;
}
