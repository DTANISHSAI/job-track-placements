import mongoose, { Schema, Model } from 'mongoose';
import { ApplicationStatus, JobType, InterviewRoundType } from '../src/types';

// User Interface
export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  studentId?: string;
  college?: string;
  graduationYear?: string;
  branch?: string;
  cgpa?: number;
  phone?: string;
  bio?: string;
  resumeUrl?: string;
  skills?: string[];
  codingProfiles?: {
    leetcode?: string;
    linkedin?: string;
    codechef?: string;
    hackerrank?: string;
    codeforces?: string;
    github?: string;
    portfolio?: string;
  };
  internships?: Array<{
    id: string;
    companyName: string;
    role: string;
    duration: string;
    location?: string;
    keyLearnings?: string;
    certificateUrl?: string;
  }>;
  certifications?: Array<{
    id: string;
    title: string;
    issuer: string;
    issueDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    studentId: { type: String, default: '' },
    college: { type: String, default: '' },
    graduationYear: { type: String, default: '2026' },
    branch: { type: String, default: 'Computer Science' },
    cgpa: { type: Number },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    skills: { type: [String], default: [] },
    codingProfiles: {
      leetcode: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      codechef: { type: String, default: '' },
      hackerrank: { type: String, default: '' },
      codeforces: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
    internships: [
      {
        id: { type: String, required: true },
        companyName: { type: String, required: true },
        role: { type: String, required: true },
        duration: { type: String, required: true },
        location: { type: String, default: '' },
        keyLearnings: { type: String, default: '' },
        certificateUrl: { type: String, default: '' },
      }
    ],
    certifications: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        issuer: { type: String, required: true },
        issueDate: { type: String, default: '' },
        credentialId: { type: String, default: '' },
        credentialUrl: { type: String, default: '' },
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Interview Subschema
export interface IInterviewSubdoc {
  id: string;
  date: string;
  time?: string;
  roundType: string;
  meetingLink?: string;
  interviewer?: string;
  notes?: string;
  completed?: boolean;
}

const InterviewSchema = new Schema<IInterviewSubdoc>(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, default: '' },
    roundType: {
      type: String,
      default: 'Technical Round 1',
    },
    meetingLink: { type: String, default: '' },
    interviewer: { type: String, default: '' },
    notes: { type: String, default: '' },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

// Status History Subschema
export interface IStatusHistoryItem {
  status: string;
  date: string;
  note?: string;
}

const StatusHistorySchema = new Schema<IStatusHistoryItem>(
  {
    status: { type: String, required: true },
    date: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { _id: false }
);

// Application Interface
export interface IApplication {
  id: string;
  userId: string;
  company: string;
  role: string;
  packageLPA: number;
  currency?: string;
  applicationDate: string;
  status: string;
  jobType: string;
  location: string;
  jobLink?: string;
  referral?: string;
  notes?: string;
  upcomingInterview?: IInterviewSubdoc;
  history?: IStatusHistoryItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    packageLPA: { type: Number, default: 0 },
    currency: { type: String, default: '₹' },
    applicationDate: { type: String, required: true },
    status: {
      type: String,
      default: 'Applied',
    },
    jobType: {
      type: String,
      default: 'Full Time',
    },
    location: { type: String, default: 'Bengaluru, India' },
    jobLink: { type: String, default: '' },
    referral: { type: String, default: '' },
    notes: { type: String, default: '' },
    upcomingInterview: { type: InterviewSchema, default: null },
    history: { type: [StatusHistorySchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export const ApplicationModel: Model<IApplication> = (mongoose.models.Application as Model<IApplication>) || mongoose.model<IApplication>('Application', ApplicationSchema);

// Resume Metadata Schema (Metadata ONLY - actual file blob is browser local storage only)
export interface IResumeMetadata {
  resumeId: string;
  userId: string;
  name: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  analysisId?: string;
  isDefault?: boolean;
}

const ResumeMetadataSchema = new Schema<IResumeMetadata>(
  {
    resumeId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    fileName: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    analysisId: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

ResumeMetadataSchema.index({ userId: 1, resumeId: 1 }, { unique: true });

export const ResumeMetadataModel: Model<IResumeMetadata> =
  (mongoose.models.ResumeMetadata as Model<IResumeMetadata>) ||
  mongoose.model<IResumeMetadata>('ResumeMetadata', ResumeMetadataSchema);

// ==================== GMAIL JOB EVENT SCHEMA ====================
export interface IGmailEvent {
  id: string;
  userId: string;
  messageId: string;
  threadId?: string;
  subject: string;
  from: string;
  to?: string;
  receivedDate: string;
  snippet: string;
  isJobRelated: boolean;
  eventType: string;
  companyName: string;
  jobTitle: string;
  recruiterName?: string;
  recruiterEmail?: string;
  interviewDate?: string;
  interviewTime?: string;
  meetingLink?: string;
  assessmentDeadline?: string;
  confidence: number;
  explanation?: string;
  matchedApplicationId?: string;
  matchedApplicationCompany?: string;
  matchedApplicationRole?: string;
  currentApplicationStatus?: string;
  proposedAction: string;
  proposedStatus?: string;
  reviewStatus: string;
  appliedAt?: string;
  dismissedAt?: string;
  createdAt: string;
}

const GmailEventSchema = new Schema<IGmailEvent>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    messageId: { type: String, required: true, index: true },
    threadId: { type: String, default: '' },
    subject: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, default: '' },
    receivedDate: { type: String, required: true },
    snippet: { type: String, default: '' },
    isJobRelated: { type: Boolean, default: true },
    eventType: { type: String, required: true },
    companyName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    recruiterName: { type: String, default: '' },
    recruiterEmail: { type: String, default: '' },
    interviewDate: { type: String, default: '' },
    interviewTime: { type: String, default: '' },
    meetingLink: { type: String, default: '' },
    assessmentDeadline: { type: String, default: '' },
    confidence: { type: Number, default: 0.8 },
    explanation: { type: String, default: '' },
    matchedApplicationId: { type: String, default: '' },
    matchedApplicationCompany: { type: String, default: '' },
    matchedApplicationRole: { type: String, default: '' },
    currentApplicationStatus: { type: String, default: '' },
    proposedAction: { type: String, default: 'NO_ACTION' },
    proposedStatus: { type: String, default: '' },
    reviewStatus: { type: String, default: 'PENDING_REVIEW', index: true },
    appliedAt: { type: String, default: '' },
    dismissedAt: { type: String, default: '' },
    createdAt: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

GmailEventSchema.index({ userId: 1, messageId: 1 }, { unique: true });

export const GmailEventModel: Model<IGmailEvent> =
  (mongoose.models.GmailEvent as Model<IGmailEvent>) ||
  mongoose.model<IGmailEvent>('GmailEvent', GmailEventSchema);

// ==================== GMAIL SYNC SETTINGS SCHEMA ====================
export interface IGmailSettings {
  userId: string;
  autoSyncHighConfidence: boolean;
  minConfidenceThreshold: number;
  connectedEmail?: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}

const GmailSettingsSchema = new Schema<IGmailSettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    autoSyncHighConfidence: { type: Boolean, default: false },
    minConfidenceThreshold: { type: Number, default: 0.90 },
    connectedEmail: { type: String, default: '' },
    isConnected: { type: Boolean, default: false },
    lastSyncedAt: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const GmailSettingsModel: Model<IGmailSettings> =
  (mongoose.models.GmailSettings as Model<IGmailSettings>) ||
  mongoose.model<IGmailSettings>('GmailSettings', GmailSettingsSchema);


