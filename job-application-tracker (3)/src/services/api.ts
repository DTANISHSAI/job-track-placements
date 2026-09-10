import { JobApplication, User, InterviewSchedule, DashboardStats, ApplicationStatus, ResumeMetadata, ResumeAnalysisResult, GmailClassifiedEvent, GmailSyncSettings } from '../types';

const TOKEN_KEY = 'jobtracker_auth_token';
const USER_KEY = 'jobtracker_user_info';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredAuth = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  sendOtp: async (email: string, name?: string) => {
    return apiRequest<{ success: boolean; message: string; otp?: string; expiresIn: number }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  },

  verifyOtp: async (email: string, otp: string) => {
    return apiRequest<{ success: boolean; verified: boolean; verificationToken: string; message: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  forgotPasswordSendOtp: async (email: string) => {
    return apiRequest<{ success: boolean; message: string; expiresIn: number }>('/api/auth/forgot-password/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  forgotPasswordVerifyOtp: async (email: string, otp: string) => {
    return apiRequest<{ success: boolean; verified: boolean; message: string }>('/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  forgotPasswordReset: async (data: { email: string; otp: string; newPassword: string }) => {
    return apiRequest<{ success: boolean; message: string }>('/api/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  register: async (userData: { name: string; email: string; password: string; college?: string; graduationYear?: string; branch?: string }) => {
    return apiRequest<{ user: User; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
    return apiRequest<{ user: User; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  demoLogin: async () => {
    return apiRequest<{ user: User; token: string; message: string }>('/api/auth/demo', {
      method: 'POST',
    });
  },

  getMe: async () => {
    return apiRequest<{ user: User }>('/api/auth/me');
  },

  updateProfile: async (profileData: Partial<User>) => {
    return apiRequest<{ user: User; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Applications
  getApplications: async (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<{ applications: JobApplication[]; total: number }>(`/api/applications${queryString}`);
  },

  createApplication: async (appData: Partial<JobApplication>) => {
    return apiRequest<{ application: JobApplication; message: string }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(appData),
    });
  },

  updateApplication: async (id: string, appData: Partial<JobApplication>) => {
    return apiRequest<{ application: JobApplication; message: string }>(`/api/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appData),
    });
  },

  updateApplicationStatus: async (id: string, status: ApplicationStatus) => {
    return apiRequest<{ application: JobApplication; message: string }>(`/api/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  deleteApplication: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/api/applications/${id}`, {
      method: 'DELETE',
    });
  },

  // Interviews
  getInterviews: async () => {
    return apiRequest<{ interviews: InterviewSchedule[] }>('/api/interviews');
  },

  scheduleInterview: async (interviewData: Partial<InterviewSchedule> & { applicationId: string; date: string; roundType: string }) => {
    return apiRequest<{ application: JobApplication; message: string }>('/api/interviews', {
      method: 'POST',
      body: JSON.stringify(interviewData),
    });
  },

  deleteInterview: async (applicationId: string) => {
    return apiRequest<{ application: JobApplication; message: string }>(`/api/interviews/${applicationId}`, {
      method: 'DELETE',
    });
  },

  // Analytics
  getAnalytics: async () => {
    return apiRequest<{ stats: DashboardStats }>('/api/analytics');
  },

  resetData: async () => {
    return apiRequest<{ applications: JobApplication[]; stats: DashboardStats; message: string }>('/api/reset-data', {
      method: 'POST',
    });
  },

  // Resume Metadata (Server persists metadata only, no binary blobs)
  getResumesMetadata: async () => {
    return apiRequest<{ resumes: ResumeMetadata[]; storageNotice: string }>('/api/resumes/metadata');
  },

  createResumeMetadata: async (meta: Partial<ResumeMetadata> & { resumeId: string; fileName: string }) => {
    return apiRequest<{ resume: ResumeMetadata; message: string }>('/api/resumes/metadata', {
      method: 'POST',
      body: JSON.stringify(meta),
    });
  },

  updateResumeMetadata: async (resumeId: string, updates: Partial<ResumeMetadata>) => {
    return apiRequest<{ resume: ResumeMetadata; message: string }>(`/api/resumes/metadata/${resumeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteResumeMetadata: async (resumeId: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/api/resumes/metadata/${resumeId}`, {
      method: 'DELETE',
    });
  },

  setDefaultResumeMetadata: async (resumeId: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/api/resumes/metadata/${resumeId}/set-default`, {
      method: 'POST',
    });
  },

  // AI Resume Analyzer (Gemini powered with multimodal PDF + text evaluation)
  analyzeResume: async (data: {
    resumeId?: string;
    resumeText?: string;
    resumeName?: string;
    targetRole?: string;
    fileDataUrl?: string;
    fileType?: string;
  }) => {
    return apiRequest<{ success: boolean; analysis: ResumeAnalysisResult; message: string }>('/api/resumes/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ==================== GMAIL JOB EMAIL DETECTION & SYNC ====================
  getGmailSettings: async () => {
    return apiRequest<{ success: boolean; settings: GmailSyncSettings }>('/api/gmail/settings');
  },

  updateGmailSettings: async (settings: Partial<GmailSyncSettings>) => {
    return apiRequest<{ success: boolean; settings: GmailSyncSettings; message: string }>('/api/gmail/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  disconnectGmail: async () => {
    return apiRequest<{ success: boolean; settings: GmailSyncSettings; message: string }>('/api/gmail/disconnect', {
      method: 'POST',
    });
  },

  getGmailEvents: async (params?: { status?: string; jobRelatedOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.jobRelatedOnly !== undefined) query.append('jobRelatedOnly', String(params.jobRelatedOnly));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<{ success: boolean; events: GmailClassifiedEvent[]; count: number }>(`/api/gmail/events${qs}`);
  },

  syncGmailBatch: async (emails: any[], userEmail?: string) => {
    return apiRequest<{
      success: boolean;
      events: GmailClassifiedEvent[];
      processedCount: number;
      autoAppliedCount: number;
      autoAppliedEvents: any[];
      message: string;
    }>('/api/gmail/sync-batch', {
      method: 'POST',
      body: JSON.stringify({ emails, userEmail }),
    });
  },

  applyGmailEvent: async (
    id: string,
    overrides?: {
      companyName?: string;
      jobTitle?: string;
      status?: ApplicationStatus;
      interviewDate?: string;
      interviewTime?: string;
      meetingLink?: string;
    }
  ) => {
    return apiRequest<{
      success: boolean;
      event: GmailClassifiedEvent;
      application: JobApplication;
      message: string;
    }>(`/api/gmail/events/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(overrides || {}),
    });
  },

  dismissGmailEvent: async (id: string) => {
    return apiRequest<{ success: boolean; event: GmailClassifiedEvent; message: string }>(`/api/gmail/events/${id}/dismiss`, {
      method: 'POST',
    });
  },

  approveAllHighConfidenceGmailEvents: async () => {
    return apiRequest<{ success: boolean; approvedCount: number; message: string }>('/api/gmail/events/approve-all-high-confidence', {
      method: 'POST',
    });
  },
};

