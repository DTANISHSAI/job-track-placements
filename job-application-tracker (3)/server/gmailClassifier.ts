import { GoogleGenAI } from '@google/genai';
import { GmailClassifiedEvent, GmailJobEventType, JobApplication, ApplicationStatus } from '../src/types';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export interface EmailInputPayload {
  messageId: string;
  threadId?: string;
  subject: string;
  from: string;
  to?: string;
  receivedDate: string;
  snippet: string;
  bodyText?: string;
}

export async function classifyEmailWithAI(
  email: EmailInputPayload,
  existingApplications: JobApplication[] = []
): Promise<Omit<GmailClassifiedEvent, 'id' | 'userId' | 'createdAt'>> {
  const ai = getAiClient();
  const emailContent = (email.bodyText && email.bodyText.length > 50 ? email.bodyText : email.snippet || email.subject).slice(0, 4000);

  const appsContext = existingApplications.map(app => ({
    id: app.id,
    company: app.company,
    role: app.role,
    status: app.status,
  }));

  const prompt = `You are an AI Job Search Assistant and ATS Email Parser for college students and job seekers.
Analyze the following incoming email to detect if it is related to a job/internship application, recruitment process, interview, assessment test, offer, or rejection.

Email Metadata:
- Subject: "${email.subject}"
- From: "${email.from}"
- Date: "${email.receivedDate}"
- Snippet/Content:
"""
${emailContent}
"""

Existing Tracked Applications in user's dashboard:
${JSON.stringify(appsContext, null, 2)}

Identify if this email is job-related (from sources like LinkedIn, Indeed, Naukri, Glassdoor, Workday, Greenhouse, Lever, SmartRecruiters, Ashby, direct recruiters, hiring managers, company HRs).

Possible Event Types:
- APPLICATION_SUBMITTED (Candidate submitted application)
- APPLICATION_RECEIVED (Company acknowledges receiving application)
- APPLICATION_VIEWED (Recruiter/portal viewed application)
- SCREENING (Initial HR screen / recruiter call invite)
- INTERVIEW_INVITATION (Technical / HR / Managerial interview scheduled or requested)
- INTERVIEW_RESCHEDULED (Interview date/time changed)
- INTERVIEW_CANCELLED (Interview cancelled)
- REJECTION (Application not moving forward / rejected)
- OFFER (Job / internship offer letter or selection confirmation)
- RECRUITER_MESSAGE (Inquiry, networking, or follow-up from recruiter)
- ASSESSMENT (Coding test, HackerRank/LeetCode/Karat link, online assessment)
- OTHER (General job newsletter, career portal update)

Determine if this email matches any existing application from the list above. Match company names fuzzily (e.g., "Microsoft India" matches "Microsoft", "Google Cloud" matches "Google").

Return STRICT JSON matching this schema:
{
  "isJobRelated": boolean,
  "eventType": string,
  "companyName": string,
  "jobTitle": string,
  "recruiterName": string,
  "recruiterEmail": string,
  "interviewDate": string,
  "interviewTime": string,
  "meetingLink": string,
  "assessmentDeadline": string,
  "confidence": number,
  "explanation": string,
  "matchedApplicationId": string
}`;

  if (ai) {
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        let text = response.text || '';
        if (text.includes('```json')) {
          text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (text.includes('```')) {
          text = text.replace(/```\s*/g, '').replace(/```\s*$/g, '');
        }
        text = text.trim();

        if (text) {
          const parsed = JSON.parse(text);
          return formatClassifiedResult(parsed, email, existingApplications);
        }
      } catch (err: any) {
        // Fallback to next model if available
      }
    }
  }

  // Deterministic Heuristic Engine Fallback
  return classifyEmailHeuristic(email, existingApplications);
}

function formatClassifiedResult(
  aiResult: any,
  email: EmailInputPayload,
  existingApplications: JobApplication[]
): Omit<GmailClassifiedEvent, 'id' | 'userId' | 'createdAt'> {
  const isJobRelated = !!aiResult.isJobRelated;
  const eventType: GmailJobEventType = normalizeEventType(aiResult.eventType);
  const companyName = (aiResult.companyName || extractCompanyFromSubjectOrFrom(email.subject, email.from)).trim();
  const jobTitle = (aiResult.jobTitle || 'Software Engineer / Placement Role').trim();
  const confidence = Math.min(1.0, Math.max(0.1, Number(aiResult.confidence) || 0.85));

  // Match application
  let matchedApp: JobApplication | undefined;
  if (aiResult.matchedApplicationId) {
    matchedApp = existingApplications.find(a => a.id === aiResult.matchedApplicationId);
  }
  if (!matchedApp && companyName) {
    const lowerCompany = companyName.toLowerCase();
    matchedApp = existingApplications.find(a => {
      const aLower = a.company.toLowerCase();
      return aLower.includes(lowerCompany) || lowerCompany.includes(aLower);
    });
  }

  // Determine proposed action and status
  let proposedAction: 'CREATE_JOB' | 'UPDATE_STATUS' | 'SCHEDULE_INTERVIEW' | 'NO_ACTION' = 'NO_ACTION';
  let proposedStatus: ApplicationStatus | undefined = undefined;

  if (isJobRelated) {
    if (eventType === 'INTERVIEW_INVITATION' || eventType === 'INTERVIEW_RESCHEDULED') {
      proposedAction = 'SCHEDULE_INTERVIEW';
      proposedStatus = 'Interview';
    } else if (eventType === 'OFFER') {
      proposedAction = 'UPDATE_STATUS';
      proposedStatus = 'Selected';
    } else if (eventType === 'REJECTION') {
      proposedAction = 'UPDATE_STATUS';
      proposedStatus = 'Rejected';
    } else if (eventType === 'ASSESSMENT' || eventType === 'SCREENING') {
      proposedAction = 'UPDATE_STATUS';
      proposedStatus = 'Assessment';
    } else if (eventType === 'APPLICATION_SUBMITTED' || eventType === 'APPLICATION_RECEIVED') {
      if (!matchedApp) {
        proposedAction = 'CREATE_JOB';
        proposedStatus = 'Applied';
      } else {
        proposedAction = matchedApp.status === 'Applied' ? 'NO_ACTION' : 'UPDATE_STATUS';
        proposedStatus = 'Applied';
      }
    } else if (!matchedApp) {
      proposedAction = 'CREATE_JOB';
      proposedStatus = 'Applied';
    }
  }

  return {
    messageId: email.messageId,
    threadId: email.threadId,
    subject: email.subject,
    from: email.from,
    to: email.to,
    receivedDate: email.receivedDate || new Date().toISOString(),
    snippet: email.snippet || email.subject,
    isJobRelated,
    eventType,
    companyName: companyName || 'Unknown Company',
    jobTitle,
    recruiterName: aiResult.recruiterName || '',
    recruiterEmail: aiResult.recruiterEmail || '',
    interviewDate: aiResult.interviewDate || '',
    interviewTime: aiResult.interviewTime || '',
    meetingLink: aiResult.meetingLink || '',
    assessmentDeadline: aiResult.assessmentDeadline || '',
    confidence,
    explanation: aiResult.explanation || `Detected ${eventType.replace(/_/g, ' ')} for ${companyName || 'job application'}.`,
    matchedApplicationId: matchedApp?.id,
    matchedApplicationCompany: matchedApp?.company,
    matchedApplicationRole: matchedApp?.role,
    currentApplicationStatus: matchedApp?.status,
    proposedAction,
    proposedStatus,
    reviewStatus: 'PENDING_REVIEW',
  };
}

export function classifyEmailHeuristic(
  email: EmailInputPayload,
  existingApplications: JobApplication[]
): Omit<GmailClassifiedEvent, 'id' | 'userId' | 'createdAt'> {
  const combined = `${email.subject} ${email.from} ${email.snippet}`.toLowerCase();
  
  const isJobSources = /(linkedin|indeed|naukri|glassdoor|workday|greenhouse|lever|smartrecruiters|ashby|taleo|myworkdayjobs|jobvite|recruiting|careers?|talent)/i.test(email.from) ||
    /(application|interview|assessment|offer|rejection|shortlisted|candidacy|applied)/i.test(email.subject);

  let eventType: GmailJobEventType = 'OTHER';
  let confidence = 0.75;

  if (/(offer letter|pleased to offer|congratulations|offer of employment|job offer)/i.test(combined)) {
    eventType = 'OFFER';
    confidence = 0.95;
  } else if (/(unfortunately|regret to inform|not moving forward|decided to pursue other|not selected|unsuccessful)/i.test(combined)) {
    eventType = 'REJECTION';
    confidence = 0.94;
  } else if (/(interview invitation|schedule your interview|interview confirmed|technical round|zoom meeting|google meet|teams meeting|discussion with)/i.test(combined)) {
    eventType = 'INTERVIEW_INVITATION';
    confidence = 0.96;
  } else if (/(online assessment|coding challenge|hackerrank|leetcode|codesignal|assessment link|test invitation)/i.test(combined)) {
    eventType = 'ASSESSMENT';
    confidence = 0.93;
  } else if (/(application submitted|application received|thank you for applying|received your application|we received your application)/i.test(combined)) {
    eventType = 'APPLICATION_SUBMITTED';
    confidence = 0.92;
  } else if (isJobSources) {
    eventType = 'APPLICATION_RECEIVED';
    confidence = 0.80;
  }

  const companyName = extractCompanyFromSubjectOrFrom(email.subject, email.from);
  let jobTitle = 'Software Engineer';
  const titleMatch = email.subject.match(/for (the )?([A-Za-z0-9 /+-]+ (Engineer|Developer|Intern|Analyst|Associate|Manager|Consultant))/i);
  if (titleMatch) {
    jobTitle = titleMatch[2].trim();
  }

  return formatClassifiedResult(
    {
      isJobRelated: isJobSources,
      eventType,
      companyName,
      jobTitle,
      confidence,
      explanation: `Heuristic classification matched ${eventType.replace(/_/g, ' ')}.`,
    },
    email,
    existingApplications
  );
}

function extractCompanyFromSubjectOrFrom(subject: string, from: string): string {
  // Try extracting from "Company Name <careers@company.com>"
  const fromNameMatch = from.match(/^"?([^"<]+)"?\s*</);
  if (fromNameMatch) {
    const raw = fromNameMatch[1].trim();
    if (!/linkedin|indeed|naukri|greenhouse|lever|workday|careers|jobs|team|recruiting|notifications/i.test(raw)) {
      return raw;
    }
  }

  // Try extracting from subject e.g. "Application to Google - Software Engineer" or "Microsoft: Next steps"
  const atMatch = subject.match(/(?:at|for|with)\s+([A-Z][A-Za-z0-9&.\s]{2,25})/);
  if (atMatch) {
    const candidate = atMatch[1].trim();
    if (!/your|our|this|the|interview|application|assessment/i.test(candidate)) {
      return candidate;
    }
  }

  const colonMatch = subject.match(/^([A-Z][A-Za-z0-9&.\s]{2,20})\s*[:|-]/);
  if (colonMatch) {
    return colonMatch[1].trim();
  }

  // Fallback domain extraction
  const domainMatch = from.match(/@([a-zA-Z0-9-]+)\./);
  if (domainMatch && !['gmail', 'yahoo', 'outlook', 'hotmail', 'linkedin', 'indeed', 'naukri'].includes(domainMatch[1])) {
    const d = domainMatch[1];
    return d.charAt(0).toUpperCase() + d.slice(1);
  }

  return 'Tech Company';
}

function normalizeEventType(raw: string): GmailJobEventType {
  const types: GmailJobEventType[] = [
    'APPLICATION_SUBMITTED',
    'APPLICATION_RECEIVED',
    'APPLICATION_VIEWED',
    'SCREENING',
    'INTERVIEW_INVITATION',
    'INTERVIEW_RESCHEDULED',
    'INTERVIEW_CANCELLED',
    'REJECTION',
    'OFFER',
    'RECRUITER_MESSAGE',
    'ASSESSMENT',
    'OTHER',
  ];
  const found = types.find(t => t.toLowerCase() === String(raw).toLowerCase().trim());
  return found || 'OTHER';
}
