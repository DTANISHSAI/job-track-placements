import React from 'react';
import { 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  CalendarClock, 
  IndianRupee, 
  MapPin, 
  Building2, 
  Sparkles,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { JobApplication, ApplicationStatus } from '../types';
import confetti from 'canvas-confetti';

interface KanbanBoardProps {
  applications: JobApplication[];
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onEdit: (app: JobApplication) => void;
  onScheduleInterview: (appId: string) => void;
  onOpenAddModal: () => void;
}

const COLUMNS: Array<{ status: ApplicationStatus; title: string; headerBg: string; border: string; badgeBg: string; textColor: string }> = [
  { status: 'Applied', title: 'Applied', headerBg: 'bg-[#F0F0EC]', border: 'border-[#E5E5E1]', badgeBg: 'bg-[#1A1A1A] text-[#FCFCFA]', textColor: 'text-[#1A1A1A]' },
  { status: 'Assessment', title: 'Assessment / OA', headerBg: 'bg-[#F2EEF5]', border: 'border-[#DDD4E6]', badgeBg: 'bg-[#58327A] text-white', textColor: 'text-[#58327A]' },
  { status: 'Interview', title: 'Interview Rounds', headerBg: 'bg-[#FBF4E8]', border: 'border-[#F0DFBE]', badgeBg: 'bg-[#87550E] text-white', textColor: 'text-[#87550E]' },
  { status: 'Selected', title: 'Selected / Offers', headerBg: 'bg-[#EEF6F0]', border: 'border-[#C9E6D1]', badgeBg: 'bg-[#1B6437] text-white', textColor: 'text-[#1B6437]' },
  { status: 'Rejected', title: 'Archived / Rejected', headerBg: 'bg-[#F7F7F6]', border: 'border-[#E5E5E1]', badgeBg: 'bg-[#E5E5E1] text-[#737373]', textColor: 'text-[#737373]' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onStatusChange,
  onEdit,
  onScheduleInterview,
  onOpenAddModal,
}) => {
  const getNextStatus = (curr: ApplicationStatus): ApplicationStatus | null => {
    if (curr === 'Applied') return 'Assessment';
    if (curr === 'Assessment') return 'Interview';
    if (curr === 'Interview') return 'Selected';
    return null;
  };

  const getPrevStatus = (curr: ApplicationStatus): ApplicationStatus | null => {
    if (curr === 'Assessment') return 'Applied';
    if (curr === 'Interview') return 'Assessment';
    if (curr === 'Selected') return 'Interview';
    if (curr === 'Rejected') return 'Applied';
    return null;
  };

  const handleAdvance = (appId: string, current: ApplicationStatus) => {
    const next = getNextStatus(current);
    if (next) {
      if (next === 'Selected') {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore
        }
      }
      onStatusChange(appId, next);
    }
  };

  const handleRevert = (appId: string, current: ApplicationStatus) => {
    const prev = getPrevStatus(current);
    if (prev) {
      onStatusChange(appId, prev);
    }
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[1100px]">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((a) => a.status === col.status);
          const totalPackage = colApps.reduce((sum, a) => sum + (a.packageLPA || 0), 0);

          return (
            <div
              key={col.status}
              id={`kanban-column-${col.status.toLowerCase()}`}
              className="flex-1 min-w-[260px] bg-[#F7F7F4] rounded-xl border border-[#E5E5E1] flex flex-col max-h-[calc(100vh-220px)]"
            >
              {/* Column Header */}
              <div className={`p-3.5 rounded-t-xl border-b ${col.border} ${col.headerBg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <h3 className={`font-serif text-sm font-semibold tracking-tight ${col.textColor}`}>
                    {col.title}
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${col.badgeBg}`}>
                    {colApps.length}
                  </span>
                </div>

                {col.status === 'Applied' && (
                  <button
                    onClick={onOpenAddModal}
                    className="p-1 rounded-md text-[#737373] hover:text-[#1A1A1A] hover:bg-white/80 transition-colors cursor-pointer"
                    title="Add Application"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {colApps.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#A3A39E] border border-dashed border-[#E5E5E1] rounded-lg">
                    No records in {col.title}
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div
                      key={app.id}
                      id={`kanban-card-${app.id}`}
                      className="bg-white rounded-lg p-3.5 border border-[#E5E5E1] shadow-xs hover:border-[#1A1A1A] transition-all group"
                    >
                      {/* Company & CTC */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-[#1A1A1A] text-[#FCFCFA] font-serif font-bold text-xs flex items-center justify-center">
                            {app.company.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-serif font-bold text-[#1A1A1A] text-sm leading-tight group-hover:text-black transition-colors">
                              {app.company}
                            </div>
                            <div className="text-[11px] text-[#737373] truncate max-w-[130px]">{app.role}</div>
                          </div>
                        </div>

                        {app.packageLPA > 0 && (
                          <span className="text-[10px] font-semibold text-[#1A1A1A] bg-[#F0F0EC] px-1.5 py-0.5 rounded border border-[#E5E5E1] whitespace-nowrap">
                            ₹{app.packageLPA} LPA
                          </span>
                        )}
                      </div>

                      {/* Location & Job Type */}
                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#737373]">
                        <span className="truncate max-w-[120px]">{app.location}</span>
                        <span className="font-medium text-[#525252] bg-[#F0F0EC] px-1.5 py-0.2 rounded border border-[#E5E5E1]">
                          {app.jobType}
                        </span>
                      </div>

                      {/* Scheduled Interview snippet if in Interview Column */}
                      {app.upcomingInterview && (
                        <div className="mt-2 p-2 bg-[#FBF4E8] rounded-md border border-[#F0DFBE] text-[11px] text-[#87550E] flex items-center justify-between gap-1">
                          <span className="truncate font-medium">{app.upcomingInterview.roundType}</span>
                          <span className="text-[10px] font-semibold text-[#87550E]">{app.upcomingInterview.date.slice(5)}</span>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="mt-3 pt-2.5 border-t border-[#E5E5E1] flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEdit(app)}
                            className="p-1 text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] rounded transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          
                          {col.status !== 'Interview' && col.status !== 'Selected' && col.status !== 'Rejected' && (
                            <button
                              onClick={() => onStatusChange(app.id, 'Rejected')}
                              className="text-[10px] text-[#A3A39E] hover:text-rose-700 font-medium px-1 cursor-pointer"
                              title="Mark as Rejected"
                            >
                              Archive
                            </button>
                          )}
                        </div>

                        {/* Pipeline Move Buttons */}
                        <div className="flex items-center gap-1">
                          {getPrevStatus(col.status) && (
                            <button
                              onClick={() => handleRevert(app.id, col.status)}
                              className="p-1 text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] rounded transition-colors cursor-pointer"
                              title="Move back"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {getNextStatus(col.status) && (
                            <button
                              onClick={() => handleAdvance(app.id, col.status)}
                              className="flex items-center gap-0.5 text-[10px] font-semibold text-[#FCFCFA] bg-[#1A1A1A] hover:bg-[#2C2C2C] px-2 py-1 rounded transition-colors cursor-pointer"
                              title="Advance stage"
                            >
                              <span>Next</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Column Footer */}
              {colApps.length > 0 && totalPackage > 0 && (
                <div className="p-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-[#737373] border-t border-[#E5E5E1] bg-white/60">
                  Avg Package: ₹{(totalPackage / colApps.length).toFixed(1)} LPA
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};
