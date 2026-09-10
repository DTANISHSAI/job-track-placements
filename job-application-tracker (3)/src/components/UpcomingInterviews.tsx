import React from 'react';
import { 
  CalendarClock, 
  Video, 
  Clock, 
  MapPin, 
  UserCheck, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Plus, 
  CalendarDays,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import { InterviewSchedule } from '../types';

interface UpcomingInterviewsProps {
  interviews: InterviewSchedule[];
  onOpenScheduleModal: (applicationId?: string) => void;
  onEditInterview: (interview: InterviewSchedule) => void;
  onDeleteInterview: (applicationId: string) => void;
}

export const UpcomingInterviews: React.FC<UpcomingInterviewsProps> = ({
  interviews,
  onOpenScheduleModal,
  onEditInterview,
  onDeleteInterview,
}) => {
  // Sort interviews into upcoming and past
  const now = new Date();
  
  const upcomingList = interviews.filter(i => {
    const interviewDateTime = new Date(`${i.date}T${i.time || '23:59'}`);
    return interviewDateTime >= now && !i.completed;
  });

  const completedOrPastList = interviews.filter(i => {
    const interviewDateTime = new Date(`${i.date}T${i.time || '23:59'}`);
    return interviewDateTime < now || i.completed;
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Schedule Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Interview Schedule</h2>
          </div>
          <p className="text-xs text-slate-700 mt-1">
            Track technical rounds, online assessments, and interview prep notes
          </p>
        </div>

        <button
          id="btn-schedule-new-interview"
          onClick={() => onOpenScheduleModal()}
          className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Schedule New Interview</span>
        </button>
      </div>

      {/* Upcoming Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Upcoming Rounds ({upcomingList.length})
            </h3>
          </div>
        </div>

        {upcomingList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No Upcoming Interviews Scheduled</h4>
            <p className="text-xs text-slate-700 max-w-sm mx-auto mt-1 mb-4">
              When a company invites you for a technical or HR round, schedule it here to keep track of dates, meeting links, and prep notes.
            </p>
            <button
              onClick={() => onOpenScheduleModal()}
              className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-lg border border-amber-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Interview</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingList.map((interview) => {
              const countdown = getCountdownString(interview.date, interview.time);
              return (
                <div
                  key={interview.id}
                  id={`interview-card-${interview.id}`}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Company & Countdown Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {interview.companyName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900 leading-snug group-hover:text-amber-700 transition-colors">
                            {interview.companyName}
                          </h4>
                          <p className="text-xs text-slate-700 font-medium">{interview.role}</p>
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${countdown.badgeClass}`}>
                        <Clock className="w-3 h-3" />
                        <span>{countdown.label}</span>
                      </span>
                    </div>

                    {/* Round Type & Time details */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Interview Round:</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {interview.roundType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          <span>Date:</span>
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formatDisplayDate(interview.date)}
                        </span>
                      </div>

                      {interview.time && (
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Time:</span>
                          </span>
                          <span className="font-semibold text-slate-800">{interview.time}</span>
                        </div>
                      )}

                      {interview.interviewer && (
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Interviewer:</span>
                          </span>
                          <span className="font-medium text-slate-700 truncate max-w-[160px]">
                            {interview.interviewer}
                          </span>
                        </div>
                      )}

                      {interview.notes && (
                        <div className="mt-2 text-xs bg-slate-50 rounded-lg p-2.5 text-slate-700 border border-slate-100/80">
                          <div className="font-semibold text-[11px] text-slate-500 mb-0.5 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Prep Notes:
                          </div>
                          <p className="line-clamp-2">{interview.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {interview.meetingLink ? (
                      <a
                        href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-xs transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Meeting</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No link provided</span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditInterview(interview)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-2 rounded-lg transition-colors"
                        title="Edit Interview"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteInterview(interview.applicationId)}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-2 rounded-lg transition-colors"
                        title="Remove Interview"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed or Past Rounds Section */}
      {completedOrPastList.length > 0 && (
        <div className="pt-4 border-t border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Past / Completed Rounds ({completedOrPastList.length})
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {completedOrPastList.map(item => (
              <div key={item.id} className="p-3.5 sm:px-4 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {item.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{item.companyName}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-600">{item.roundType}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{formatDisplayDate(item.date)}</span>
                  <button
                    onClick={() => onEditInterview(item)}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' });
  } catch {
    return dateStr;
  }
}

function getCountdownString(dateStr: string, timeStr?: string): { label: string; badgeClass: string } {
  try {
    const target = new Date(`${dateStr}T${timeStr || '12:00'}`);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { label: 'Completed', badgeClass: 'bg-slate-100 text-slate-600' };
    }
    if (diffHours <= 12) {
      return { label: 'Today', badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse' };
    }
    if (diffDays === 1) {
      return { label: 'Tomorrow', badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200' };
    }
    if (diffDays <= 7) {
      return { label: `In ${diffDays} days`, badgeClass: 'bg-amber-50 text-amber-700 border border-amber-100' };
    }
    return { label: `In ${diffDays} days`, badgeClass: 'bg-slate-100 text-slate-700' };
  } catch {
    return { label: 'Upcoming', badgeClass: 'bg-slate-100 text-slate-700' };
  }
}
