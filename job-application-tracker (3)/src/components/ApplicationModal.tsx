import React, { useState, useEffect } from 'react';
import { 
  X, 
  Briefcase, 
  Building2, 
  IndianRupee, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  UserPlus, 
  FileText, 
  CalendarClock,
  Sparkles,
  Check
} from 'lucide-react';
import { JobApplication, ApplicationStatus, JobType, InterviewRoundType } from '../types';
import confetti from 'canvas-confetti';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<JobApplication>) => Promise<void>;
  initialData?: JobApplication | null;
}

const TOP_COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Atlassian', 'Flipkart', 
  'Adobe', 'Goldman Sachs', 'Oracle', 'Uber', 'Cisco',
  'TCS Digital', 'Infosys (Power Programmer)', 'Morgan Stanley', 'Salesforce'
];

const COMMON_ROLES = [
  'Software Development Engineer (SDE-1)',
  'Associate Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Engineer',
  'Graduate Engineer Trainee (GET)',
  'Data Analyst / Data Scientist',
  'Product Analyst'
];

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string; desc: string; color: string; badge: string }> = [
  { value: 'Applied', label: 'Applied', desc: 'Application submitted', color: 'border-[#1A1A1A] bg-[#F0F0EC] text-[#1A1A1A]', badge: 'bg-[#F0F0EC] text-[#1A1A1A]' },
  { value: 'Assessment', label: 'Assessment', desc: 'OA / Coding test pending', color: 'border-[#58327A] bg-[#F2EEF5] text-[#58327A]', badge: 'bg-[#F2EEF5] text-[#58327A]' },
  { value: 'Interview', label: 'Interview', desc: 'Technical or HR round', color: 'border-[#87550E] bg-[#FBF4E8] text-[#87550E]', badge: 'bg-[#FBF4E8] text-[#87550E]' },
  { value: 'Selected', label: 'Selected', desc: 'Offer letter received!', color: 'border-[#1B6437] bg-[#EEF6F0] text-[#1B6437]', badge: 'bg-[#EEF6F0] text-[#1B6437]' },
  { value: 'Rejected', label: 'Rejected', desc: 'Application concluded', color: 'border-[#A3A39E] bg-[#F7F7F6] text-[#737373]', badge: 'bg-[#F7F7F6] text-[#737373]' },
];

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [packageLPA, setPackageLPA] = useState<string>('');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<ApplicationStatus>('Applied');
  const [jobType, setJobType] = useState<JobType>('Full Time');
  const [location, setLocation] = useState('Bengaluru, India');
  const [jobLink, setJobLink] = useState('');
  const [referral, setReferral] = useState('');
  const [notes, setNotes] = useState('');

  // Embedded Interview fields
  const [scheduleInterview, setScheduleInterview] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('14:00');
  const [interviewRound, setInterviewRound] = useState<InterviewRoundType>('Technical Round 1');
  const [meetingLink, setMeetingLink] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company || '');
      setRole(initialData.role || '');
      setPackageLPA(initialData.packageLPA ? String(initialData.packageLPA) : '');
      setApplicationDate(initialData.applicationDate || new Date().toISOString().split('T')[0]);
      setStatus(initialData.status || 'Applied');
      setJobType(initialData.jobType || 'Full Time');
      setLocation(initialData.location || 'Bengaluru, India');
      setJobLink(initialData.jobLink || '');
      setReferral(initialData.referral || '');
      setNotes(initialData.notes || '');

      if (initialData.upcomingInterview) {
        setScheduleInterview(true);
        setInterviewDate(initialData.upcomingInterview.date || '');
        setInterviewTime(initialData.upcomingInterview.time || '14:00');
        setInterviewRound(initialData.upcomingInterview.roundType || 'Technical Round 1');
        setMeetingLink(initialData.upcomingInterview.meetingLink || '');
        setInterviewer(initialData.upcomingInterview.interviewer || '');
        setInterviewNotes(initialData.upcomingInterview.notes || '');
      } else {
        setScheduleInterview(false);
        setInterviewDate('');
      }
    } else {
      // Reset form
      setCompany('');
      setRole('');
      setPackageLPA('');
      setApplicationDate(new Date().toISOString().split('T')[0]);
      setStatus('Applied');
      setJobType('Full Time');
      setLocation('Bengaluru, India');
      setJobLink('');
      setReferral('');
      setNotes('');
      setScheduleInterview(false);
      setInterviewDate('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleStatusSelect = (newStatus: ApplicationStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Selected') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }
    if (newStatus === 'Interview' && !scheduleInterview) {
      setScheduleInterview(true);
      if (!interviewDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        setInterviewDate(tomorrow.toISOString().split('T')[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      setError('Please enter the company name.');
      return;
    }
    if (!role.trim()) {
      setError('Please specify the job role.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<JobApplication> = {
        company: company.trim(),
        role: role.trim(),
        packageLPA: packageLPA ? parseFloat(packageLPA) : 0,
        applicationDate,
        status,
        jobType,
        location: location.trim(),
        jobLink: jobLink.trim(),
        referral: referral.trim(),
        notes: notes.trim(),
      };

      if (scheduleInterview && interviewDate) {
        payload.upcomingInterview = {
          id: initialData?.upcomingInterview?.id || undefined,
          applicationId: initialData?.id || '',
          companyName: company.trim(),
          role: role.trim(),
          date: interviewDate,
          time: interviewTime,
          roundType: interviewRound,
          meetingLink: meetingLink.trim(),
          interviewer: interviewer.trim(),
          notes: interviewNotes.trim(),
          completed: false,
        } as any;
      } else if (!scheduleInterview && initialData?.upcomingInterview) {
        // user unchecked interview
        payload.upcomingInterview = undefined;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        id="application-modal-content"
        className="bg-[#FCFCFA] rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E5E5E1]"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#FCFCFA]/95 backdrop-blur-xs z-10 px-6 py-4 border-b border-[#E5E5E1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0F0EC] text-[#1A1A1A] border border-[#E5E5E1] flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                {initialData ? 'Edit Placement Application' : 'Add Placement Record'}
              </h3>
              <p className="text-xs text-[#737373]">Record company details, CTC package, and recruitment stage</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* 1. Company Name with Quick Suggest Chips */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
              Company Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                id="input-company-name"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google, Microsoft, Atlassian, Amazon"
                className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] focus:border-[#1A1A1A] transition-all"
                required
              />
            </div>
            {/* Quick Company Suggestion Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-[#737373] mr-1">Suggested:</span>
              {TOP_COMPANIES.slice(0, 6).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCompany(c)}
                  className="text-[11px] font-medium bg-[#F0F0EC] hover:bg-[#E5E5E1] text-[#1A1A1A] px-2 py-0.5 rounded transition-colors cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Job Role with Suggestion list */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
              Job Role / Designation <span className="text-rose-600">*</span>
            </label>
            <input
              id="input-job-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Development Engineer - I, Frontend Specialist"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] focus:border-[#1A1A1A] transition-all"
              required
            />
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-[#737373] mr-1">Popular:</span>
              {COMMON_ROLES.slice(0, 4).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className="text-[11px] font-medium bg-[#F0F0EC] hover:bg-[#E5E5E1] text-[#1A1A1A] px-2 py-0.5 rounded transition-colors truncate max-w-[200px] cursor-pointer"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Package & Application Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Package / CTC (in ₹ LPA)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373] font-serif font-bold text-sm">
                  ₹
                </div>
                <input
                  id="input-package-lpa"
                  type="number"
                  step="0.5"
                  min="0"
                  value={packageLPA}
                  onChange={(e) => setPackageLPA(e.target.value)}
                  placeholder="e.g. 24.5"
                  className="w-full pl-8 pr-12 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-xs font-bold text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] focus:border-[#1A1A1A] transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-[#737373]">
                  LPA
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Application Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="input-application-date"
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className="w-full pl-9.5 pr-3 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] focus:border-[#1A1A1A] transition-all"
                />
              </div>
            </div>
          </div>

          {/* 4. Application Status Stage Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">
              Application Status <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => handleStatusSelect(opt.value)}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? `${opt.color} border font-semibold shadow-xs` 
                        : 'border-[#E5E5E1] bg-white hover:bg-[#F0F0EC] text-[#525252]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-[10px] opacity-70 mt-1 line-clamp-1">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Job Type & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Job Type
              </label>
              <select
                id="select-job-type"
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all"
              >
                <option value="Full Time">Full Time (FTE)</option>
                <option value="Internship">Internship</option>
                <option value="6M Intern + FTE">6M Intern + FTE (PPO)</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="input-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Hyderabad, Remote"
                  className="w-full pl-9.5 pr-3 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all"
                />
              </div>
            </div>
          </div>

          {/* 6. Referral & Job Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Job Link / Careers Portal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  id="input-job-link"
                  type="url"
                  value={jobLink}
                  onChange={(e) => setJobLink(e.target.value)}
                  placeholder="https://company.com/careers/..."
                  className="w-full pl-9.5 pr-3 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Referral / Source
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <input
                  id="input-referral"
                  type="text"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  placeholder="e.g. On-Campus Cell, Senior Alumni, Employee"
                  className="w-full pl-9.5 pr-3 py-2.5 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all"
                />
              </div>
            </div>
          </div>

          {/* 7. Preparation Notes / Checklist */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
              Preparation Notes & Tips
            </label>
            <textarea
              id="textarea-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Important topics to revise (Graphs, DP, System Design), interview round notes, recruiter contact..."
              className="w-full px-3.5 py-2 bg-white border border-[#E5E5E1] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all font-serif"
            />
          </div>

          {/* 8. Interview Scheduler Accordion */}
          <div className="p-4 bg-[#FBF4E8] rounded-xl border border-[#F0DFBE]">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleInterview}
                  onChange={(e) => {
                    setScheduleInterview(e.target.checked);
                    if (e.target.checked && !interviewDate) {
                      const d = new Date();
                      d.setDate(d.getDate() + 2);
                      setInterviewDate(d.toISOString().split('T')[0]);
                    }
                  }}
                  className="w-4 h-4 rounded text-[#87550E] focus:ring-[#87550E] border-[#F0DFBE]"
                />
                <span className="text-xs font-semibold text-[#87550E] flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-[#87550E]" />
                  Schedule an Upcoming Interview for this application
                </span>
              </label>
            </div>

            {scheduleInterview && (
              <div className="mt-3.5 pt-3.5 border-t border-[#F0DFBE] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#87550E] mb-1">Round Type</label>
                    <select
                      value={interviewRound}
                      onChange={(e) => setInterviewRound(e.target.value as InterviewRoundType)}
                      className="w-full px-2.5 py-2 bg-white border border-[#F0DFBE] rounded-md text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#87550E]"
                    >
                      <option value="Online Assessment">Online Assessment</option>
                      <option value="Technical Round 1">Technical Round 1</option>
                      <option value="Technical Round 2">Technical Round 2</option>
                      <option value="System Design">System Design</option>
                      <option value="HR Round">HR Round</option>
                      <option value="Managerial Round">Managerial Round</option>
                      <option value="Final Discussion">Final Discussion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#87550E] mb-1">Date</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-[#F0DFBE] rounded-md text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#87550E]"
                      required={scheduleInterview}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#87550E] mb-1">Time</label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-[#F0DFBE] rounded-md text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#87550E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#87550E] mb-1">Meeting URL (Meet/Zoom/Teams)</label>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-2.5 py-2 bg-white border border-[#F0DFBE] rounded-md text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#87550E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#87550E] mb-1">Interviewer Name / Panel</label>
                    <input
                      type="text"
                      value={interviewer}
                      onChange={(e) => setInterviewer(e.target.value)}
                      placeholder="e.g. Lead SDE, HR Manager"
                      className="w-full px-2.5 py-2 bg-white border border-[#F0DFBE] rounded-md text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#87550E]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E5E5E1] text-xs font-medium text-[#525252] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-application"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#1A1A1A] hover:bg-[#2C2C2C] disabled:opacity-50 text-[#FCFCFA] text-xs font-semibold shadow-xs border border-[#1A1A1A] transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span>{initialData ? 'Update Record' : 'Save Application'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
