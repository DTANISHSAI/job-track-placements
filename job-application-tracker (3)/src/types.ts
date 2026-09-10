export type ApplicationStatus = 'Applied' | 'Assessment' | 'Interview' | 'Selected' | 'Rejected';

export type JobType = 'Full Time' | 'Internship' | '6M Intern + FTE' | 'Contract';

export type InterviewRoundType = 
  | 'Online Assessment'
  | 'Technical Round 1'
  | 'Technical Round 2'
  | 'System Design'
  | 'HR Round'
  | 'Managerial Round'
  | 'Director Round'
  | 'Final Discussion';

export interface InterviewSchedule {
  id: string;
  applicationId: string;
  companyName: string;
  role: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h or 12h formatted)
  roundType: InterviewRoundType;
  meetingLink?: string;
  location?: string;
  interviewer?: string;
  notes?: string;
  completed?: boolean;
}

export interface StatusHistoryItem {
  status: ApplicationStatus;
  date: string;
  note?: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  role: string;
  packageLPA: number; // in Lakhs per Annum (LPA) or CTC equivalent
  currency?: string; // default '₹' or 'INR' / 'LPA'
  applicationDate: string; // YYYY-MM-DD
  status: ApplicationStatus;
  jobType: JobType;
  location: string;
  jobLink?: string;
  referral?: string;
  notes?: string;
  upcomingInterview?: InterviewSchedule;
  history: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CodingProfiles {
  leetcode?: string;
  linkedin?: string;
  codechef?: string;
  hackerrank?: string;
  codeforces?: string;
  github?: string;
  portfolio?: string;
}

export interface InternshipExperience {
  id: string;
  companyName: string;
  role: string;
  duration: string;
  location?: string;
  keyLearnings?: string;
  certificateUrl?: string;
}

export interface StudentCertification {
  id: string;
  title: string;
  issuer: string;
  issueDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  college?: string;
  graduationYear?: string;
  branch?: string;
  cgpa?: number;
  phone?: string;
  bio?: string;
  resumeUrl?: string;
  skills?: string[];
  codingProfiles?: CodingProfiles;
  internships?: InternshipExperience[];
  certifications?: StudentCertification[];
  avatar?: string;
}

export interface DashboardStats {
  totalApplications: number;
  appliedCount: number;
  assessmentCount: number;
  interviewCount: number;
  selectedCount: number;
  rejectedCount: number;
  highestPackage: number;
  averagePackage: number;
  totalOffers: number;
  upcomingInterviewsCount: number;
  responseRate: number; // percentage
  selectionRate: number; // percentage
}

export interface FilterOptions {
  searchQuery: string;
  status: ApplicationStatus | 'All';
  jobType: JobType | 'All';
  minPackage: number;
  sortBy: 'date-desc' | 'date-asc' | 'package-desc' | 'package-asc' | 'company-asc';
}

// Server Metadata ONLY (MongoDB / JSON DB)
export interface ResumeMetadata {
  resumeId: string;
  userId: string;
  name: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  analysisId?: string;
  isDefault?: boolean;
}

// AI Resume Analysis Result Schema
export interface ResumeAnalysisResult {
  id?: string;
  resumeId: string;
  analyzedAt: string;
  overallScore: number; // 0-100
  atsScore: number; // 0-100
  summary: string;
  skills: {
    technicalSkills: string[];
    softSkills: string[];
  };
  experience: {
    score: number;
    evaluation: string;
    keyPoints: string[];
  };
  education: {
    score: number;
    evaluation: string;
    keyPoints: string[];
  };
  projects: {
    score: number;
    evaluation: string;
    keyPoints: string[];
  };
  certifications: {
    score: number;
    evaluation: string;
    keyPoints: string[];
  };
  strengths: string[];
  weaknesses: string[];
  missingInformation: string[];
  formattingIssues: string[];
  suggestions: string[];
}

// Browser-Only Local Resume Entity (IndexedDB)
export interface LocalResume {
  resumeId: string;
  userId?: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileBlob?: Blob | ArrayBuffer | string;
  dataUrl?: string; // base64 Data URL for previewing in iframe / PDF viewer
  textContent?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  analysis?: ResumeAnalysisResult;
}

// ==================== GMAIL JOB EMAIL DETECTION & SYNC ====================

export type GmailJobEventType =
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_VIEWED'
  | 'SCREENING'
  | 'INTERVIEW_INVITATION'
  | 'INTERVIEW_RESCHEDULED'
  | 'INTERVIEW_CANCELLED'
  | 'REJECTION'
  | 'OFFER'
  | 'RECRUITER_MESSAGE'
  | 'ASSESSMENT'
  | 'OTHER';

export type GmailEventReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'DISMISSED' | 'AUTO_APPLIED';

export type GmailProposedAction = 'CREATE_JOB' | 'UPDATE_STATUS' | 'SCHEDULE_INTERVIEW' | 'NO_ACTION';

export interface GmailClassifiedEvent {
  id: string;
  userId: string;
  messageId: string;
  threadId?: string;
  subject: string;
  from: string;
  to?: string;
  receivedDate: string;
  snippet: string;
  
  // AI Extraction fields
  isJobRelated: boolean;
  eventType: GmailJobEventType;
  companyName: string;
  jobTitle: string;
  recruiterName?: string;
  recruiterEmail?: string;
  interviewDate?: string;
  interviewTime?: string;
  meetingLink?: string;
  assessmentDeadline?: string;
  confidence: number; // 0.0 to 1.0 (e.g. 0.96)
  explanation?: string;

  // Sync Action & Review Status
  matchedApplicationId?: string;
  matchedApplicationCompany?: string;
  matchedApplicationRole?: string;
  currentApplicationStatus?: ApplicationStatus;
  proposedAction: GmailProposedAction;
  proposedStatus?: ApplicationStatus;
  reviewStatus: GmailEventReviewStatus;
  appliedAt?: string;
  dismissedAt?: string;
  createdAt: string;
}

export interface GmailSyncSettings {
  autoSyncHighConfidence: boolean; // default: false
  minConfidenceThreshold: number; // default: 0.90 (90%)
  connectedEmail?: string;
  isConnected: boolean;
  lastSyncedAt?: string;
  totalEventsDetected?: number;
  pendingReviewCount?: number;
}


