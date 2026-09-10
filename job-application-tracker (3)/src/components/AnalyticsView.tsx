import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  IndianRupee, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Briefcase, 
  Trophy,
  Award,
  Sparkles,
  Layers
} from 'lucide-react';
import { JobApplication, DashboardStats } from '../types';

interface AnalyticsViewProps {
  applications: JobApplication[];
  stats: DashboardStats | null;
  onResetData: () => Promise<void>;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  applications,
  stats,
  onResetData,
}) => {
  const total = applications.length;

  // Package Tier Breakdown
  const tierSuperDream = applications.filter(a => a.packageLPA >= 30);
  const tierDream = applications.filter(a => a.packageLPA >= 18 && a.packageLPA < 30);
  const tierStandard = applications.filter(a => a.packageLPA >= 8 && a.packageLPA < 18);
  const tierEntry = applications.filter(a => a.packageLPA > 0 && a.packageLPA < 8);

  // Offers List
  const offersList = applications.filter(a => a.status === 'Selected');

  // Job Type Breakdown
  const fteCount = applications.filter(a => a.jobType === 'Full Time').length;
  const internCount = applications.filter(a => a.jobType === 'Internship').length;
  const ppoCount = applications.filter(a => a.jobType === '6M Intern + FTE').length;

  // CSV Export
  const handleExportCSV = () => {
    if (applications.length === 0) return;

    const headers = ['Company', 'Job Role', 'Package (LPA)', 'Status', 'Job Type', 'Location', 'Application Date', 'Interview Scheduled', 'Notes'];
    const rows = applications.map(a => [
      `"${a.company.replace(/"/g, '""')}"`,
      `"${a.role.replace(/"/g, '""')}"`,
      a.packageLPA || 0,
      `"${a.status}"`,
      `"${a.jobType}"`,
      `"${a.location.replace(/"/g, '""')}"`,
      a.applicationDate,
      a.upcomingInterview ? `"${a.upcomingInterview.roundType} on ${a.upcomingInterview.date}"` : '"None"',
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Placement_Applications_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Export & Reset Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-[#E5E5E1] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0F0EC] text-[#1A1A1A] border border-[#E5E5E1] flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#1A1A1A] tracking-tight">Placement Analytics & Insights</h2>
          </div>
          <p className="text-xs text-[#737373] mt-1">
            Package breakdown, conversion funnel distribution, and placement reports
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-[#1A1A1A] hover:bg-[#2C2C2C] text-[#FCFCFA] text-xs font-semibold px-3.5 py-2 rounded-lg border border-[#1A1A1A] transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>

          <button
            id="btn-reset-sample-data"
            onClick={onResetData}
            className="flex items-center gap-1.5 bg-[#F0F0EC] hover:bg-[#E5E5E1] text-[#1A1A1A] text-xs font-medium px-3 py-2 rounded-lg border border-[#E5E5E1] transition-colors cursor-pointer"
            title="Reset to sample dataset"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#737373]" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Offers Showcase (If Any) */}
      {offersList.length > 0 && (
        <div className="bg-[#1A1A1A] rounded-xl p-5 text-[#FCFCFA] border border-[#1A1A1A] shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-[#EEF6F0]" />
            <h3 className="font-serif text-sm font-semibold uppercase tracking-widest text-[#E5E5E1]">
              Placement Offers Secured ({offersList.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {offersList.map(offer => (
              <div key={offer.id} className="bg-white/5 rounded-lg p-3.5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-base text-[#FCFCFA]">{offer.company}</div>
                  <span className="text-xs font-semibold text-[#EEF6F0] bg-[#1B6437]/40 px-2 py-0.5 rounded border border-[#C9E6D1]/30">
                    ₹{offer.packageLPA} LPA
                  </span>
                </div>
                <div className="text-xs text-[#E5E5E1] mt-1">{offer.role}</div>
                <div className="text-[11px] text-[#A3A39E] mt-2 flex items-center justify-between">
                  <span>{offer.jobType}</span>
                  <span>{offer.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Tier Distribution & Job Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Package Tiers */}
        <div className="bg-white rounded-xl p-5 border border-[#E5E5E1] shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">CTC Package Tiers</h3>
          </div>

          <div className="space-y-3.5">
            {/* Super Dream Tier */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#1A1A1A]">Super Dream (≥ 30 LPA)</span>
                <span className="font-semibold text-[#1A1A1A]">{tierSuperDream.length} companies ({total > 0 ? Math.round((tierSuperDream.length / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-[#F0F0EC] rounded-full h-2 overflow-hidden">
                <div 
                  style={{ width: `${total > 0 ? (tierSuperDream.length / total) * 100 : 0}%` }}
                  className="bg-[#1A1A1A] h-full rounded-full"
                />
              </div>
            </div>

            {/* Dream Tier */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#1A1A1A]">Dream Tier (18 - 30 LPA)</span>
                <span className="font-semibold text-[#525252]">{tierDream.length} companies ({total > 0 ? Math.round((tierDream.length / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-[#F0F0EC] rounded-full h-2 overflow-hidden">
                <div 
                  style={{ width: `${total > 0 ? (tierDream.length / total) * 100 : 0}%` }}
                  className="bg-[#525252] h-full rounded-full"
                />
              </div>
            </div>

            {/* Standard Tier */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#1A1A1A]">Standard Tier (8 - 18 LPA)</span>
                <span className="font-semibold text-[#737373]">{tierStandard.length} companies ({total > 0 ? Math.round((tierStandard.length / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-[#F0F0EC] rounded-full h-2 overflow-hidden">
                <div 
                  style={{ width: `${total > 0 ? (tierStandard.length / total) * 100 : 0}%` }}
                  className="bg-[#737373] h-full rounded-full"
                />
              </div>
            </div>

            {/* Entry Tier */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#1A1A1A]">Entry Tier (&lt; 8 LPA)</span>
                <span className="font-semibold text-[#A3A39E]">{tierEntry.length} companies ({total > 0 ? Math.round((tierEntry.length / total) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-[#F0F0EC] rounded-full h-2 overflow-hidden">
                <div 
                  style={{ width: `${total > 0 ? (tierEntry.length / total) * 100 : 0}%` }}
                  className="bg-[#A3A39E] h-full rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Opportunity Types */}
        <div className="bg-white rounded-xl p-5 border border-[#E5E5E1] shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">Opportunity Distribution</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#F0F0EC] p-3 rounded-lg border border-[#E5E5E1] text-center">
              <div className="font-serif text-xl font-bold text-[#1A1A1A]">{fteCount}</div>
              <div className="text-[10px] font-semibold text-[#737373] mt-0.5 uppercase tracking-wider">Full Time</div>
            </div>
            <div className="bg-[#F0F0EC] p-3 rounded-lg border border-[#E5E5E1] text-center">
              <div className="font-serif text-xl font-bold text-[#1A1A1A]">{internCount}</div>
              <div className="text-[10px] font-semibold text-[#737373] mt-0.5 uppercase tracking-wider">Internship</div>
            </div>
            <div className="bg-[#F0F0EC] p-3 rounded-lg border border-[#E5E5E1] text-center">
              <div className="font-serif text-xl font-bold text-[#1A1A1A]">{ppoCount}</div>
              <div className="text-[10px] font-semibold text-[#737373] mt-0.5 uppercase tracking-wider">6M + PPO</div>
            </div>
          </div>

          <div className="text-xs text-[#737373] bg-[#FCFCFA] p-3.5 rounded-lg border border-[#E5E5E1]">
            <p className="font-serif font-semibold text-[#1A1A1A] mb-1">Placement Strategy Note:</p>
            <p className="leading-relaxed">Maintain consistent problem solving practice and schedule mock rounds 2 days prior to any technical interviews.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
