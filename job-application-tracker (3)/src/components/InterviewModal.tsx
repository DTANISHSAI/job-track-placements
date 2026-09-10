import React, { useState, useEffect } from 'react';
import { 
  X, 
  CalendarDays, 
  Clock, 
  Video, 
  Building2, 
  UserCheck, 
  FileText,
  CalendarCheck,
  Check
} from 'lucide-react';
import { InterviewSchedule, JobApplication, InterviewRoundType } from '../types';

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (interviewData: Partial<InterviewSchedule> & { applicationId: string; date: string; roundType: InterviewRoundType }) => Promise<void>;
  applications: JobApplication[];
  initialApplicationId?: string;
  initialInterview?: InterviewSchedule | null;
}

export const InterviewModal: React.FC<InterviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  applications,
  initialApplicationId,
  initialInterview,
}) => {
  const [applicationId, setApplicationId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [roundType, setRoundType] = useState<InterviewRoundType>('Technical Round 1');
  const [meetingLink, setMeetingLink] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialInterview) {
      setApplicationId(initialInterview.applicationId || '');
      setDate(initialInterview.date || '');
      setTime(initialInterview.time || '14:00');
      setRoundType(initialInterview.roundType || 'Technical Round 1');
      setMeetingLink(initialInterview.meetingLink || '');
      setInterviewer(initialInterview.interviewer || '');
      setNotes(initialInterview.notes || '');
    } else {
      setApplicationId(initialApplicationId || (applications.length > 0 ? applications[0].id : ''));
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      setDate(tomorrow.toISOString().split('T')[0]);
      setTime('14:00');
      setRoundType('Technical Round 1');
      setMeetingLink('');
      setInterviewer('');
      setNotes('');
    }
    setError(null);
  }, [initialInterview, initialApplicationId, isOpen, applications]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) {
      setError('Please select a company application.');
      return;
    }
    if (!date) {
      setError('Please choose an interview date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        id: initialInterview?.id,
        applicationId,
        date,
        time,
        roundType,
        meetingLink: meetingLink.trim(),
        interviewer: interviewer.trim(),
        notes: notes.trim(),
        completed: false,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        id="interview-modal-content"
        className="bg-[#FCFCFA] rounded-2xl max-w-lg w-full shadow-2xl border border-[#E5E5E1] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E1] flex items-center justify-between bg-[#FCFCFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FBF4E8] text-[#87550E] border border-[#F0DFBE] flex items-center justify-center font-bold">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                {initialInterview ? 'Edit Interview Session' : 'Schedule Interview Round'}
              </h3>
              <p className="text-xs text-[#737373]">Set round timeline, meeting coordinates, and focus areas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Select Application */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
              Select Company Application <span className="text-rose-600">*</span>
            </label>
            <select
              id="select-interview-application"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              disabled={!!initialInterview}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] disabled:opacity-70 transition-all"
              required
            >
              <option value="">-- Choose Company --</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company} — {app.role} ({app.status})
                </option>
              ))}
            </select>
          </div>

          {/* Round Type */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
              Interview Round Type <span className="text-rose-600">*</span>
            </label>
            <select
              id="select-round-type"
              value={roundType}
              onChange={(e) => setRoundType(e.target.value as InterviewRoundType)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all"
            >
              <option value="Online Assessment">Online Assessment / Coding Test</option>
              <option value="Technical Round 1">Technical Round 1 (Data Structures & Algorithms)</option>
              <option value="Technical Round 2">Technical Round 2 (Core CS & Problem Solving)</option>
              <option value="System Design">System Design / Architecture</option>
              <option value="Managerial Round">Managerial / Team Fit</option>
              <option value="HR Round">HR Discussion & Culture Fit</option>
              <option value="Director Round">Director / VP Round</option>
              <option value="Final Discussion">Final Offer Discussion</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Date <span className="text-rose-600">*</span>
              </label>
              <input
                id="input-interview-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Time
              </label>
              <input
                id="input-interview-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all"
              />
            </div>
          </div>

          {/* Meeting URL */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
              Online Meeting Link (Google Meet, Zoom, Teams)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                <Video className="w-4 h-4" />
              </div>
              <input
                id="input-meeting-link"
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xyz-abcd-efg"
                className="w-full pl-9.5 pr-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all"
              />
            </div>
          </div>

          {/* Interviewer */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
              Interviewer Name / Title
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                <UserCheck className="w-4 h-4" />
              </div>
              <input
                id="input-interviewer"
                type="text"
                value={interviewer}
                onChange={(e) => setInterviewer(e.target.value)}
                placeholder="e.g. Senior Engineering Manager"
                className="w-full pl-9.5 pr-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all"
              />
            </div>
          </div>

          {/* Preparation Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
              Round Preparation Notes
            </label>
            <textarea
              id="input-interview-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key concepts to review (Trie, Dynamic Programming, System Design Tradeoffs, etc.)"
              className="w-full px-3 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all font-serif"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E5E5E1] text-xs font-medium text-[#525252] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-interview"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#1A1A1A] hover:bg-[#2C2C2C] disabled:opacity-50 text-[#FCFCFA] text-xs font-semibold shadow-xs border border-[#1A1A1A] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{initialInterview ? 'Update Schedule' : 'Schedule Round'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
