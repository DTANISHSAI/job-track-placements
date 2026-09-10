import * as repo from './repository';
import { GmailClassifiedEvent, JobApplication, InterviewSchedule } from '../src/types';

export async function applyGmailEventAction(
  userId: string,
  eventId: string,
  customOverrides?: {
    companyName?: string;
    jobTitle?: string;
    status?: any;
    interviewDate?: string;
    interviewTime?: string;
    meetingLink?: string;
  }
): Promise<{ success: boolean; event: GmailClassifiedEvent; application?: JobApplication; message: string }> {
  const event = await repo.getGmailEventById(userId, eventId);
  if (!event) {
    throw new Error('Gmail event not found');
  }

  const companyName = customOverrides?.companyName || event.companyName;
  const jobTitle = customOverrides?.jobTitle || event.jobTitle;
  const targetStatus = customOverrides?.status || event.proposedStatus || 'Applied';
  const existingApps = await repo.getApplicationsByUserId(userId);

  // Find matching application
  let matchedApp = event.matchedApplicationId 
    ? existingApps.find(a => a.id === event.matchedApplicationId)
    : undefined;

  if (!matchedApp && companyName) {
    const lowerCompany = companyName.toLowerCase();
    matchedApp = existingApps.find(a => {
      const aLower = a.company.toLowerCase();
      return aLower.includes(lowerCompany) || lowerCompany.includes(aLower);
    });
  }

  let finalApp: JobApplication;

  if (matchedApp) {
    // Update existing job application
    const historyNote = `Updated via Gmail (${event.eventType.replace(/_/g, ' ')}): ${event.subject}`;
    
    // Prepare interview if applicable
    let upcomingInterview = matchedApp.upcomingInterview;
    const interviewDate = customOverrides?.interviewDate || event.interviewDate;
    if (event.proposedAction === 'SCHEDULE_INTERVIEW' || event.eventType === 'INTERVIEW_INVITATION' || interviewDate) {
      upcomingInterview = {
        id: upcomingInterview?.id || `int-${Date.now()}`,
        applicationId: matchedApp.id,
        companyName: matchedApp.company,
        role: matchedApp.role,
        date: interviewDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        time: customOverrides?.interviewTime || event.interviewTime || '14:00',
        roundType: 'Technical Round 1',
        meetingLink: customOverrides?.meetingLink || event.meetingLink || '',
        interviewer: event.recruiterName || 'Hiring Team',
        notes: `Invited via email: ${event.subject}`,
        completed: false,
      };
    }

    const updated = await repo.updateApplication(userId, matchedApp.id, {
      status: targetStatus,
      upcomingInterview,
      notes: matchedApp.notes 
        ? `${matchedApp.notes}\n[Gmail Sync ${new Date().toLocaleDateString()}]: ${event.snippet.slice(0, 100)}...`
        : `[Gmail Sync]: ${event.snippet.slice(0, 150)}...`,
    });

    if (!updated) {
      throw new Error('Failed to update matched job application');
    }
    finalApp = updated;
  } else {
    // Create new application
    const newAppPayload: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      company: companyName || 'Company',
      role: jobTitle || 'Software Engineer',
      packageLPA: 12.0,
      currency: '₹',
      applicationDate: event.receivedDate ? event.receivedDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: targetStatus,
      jobType: 'Full Time',
      location: 'Pan India / Hybrid',
      notes: `Imported automatically from Gmail (${event.from}): ${event.subject}`,
      history: [
        {
          status: targetStatus,
          date: new Date().toISOString().slice(0, 10),
          note: `Detected from Gmail email: ${event.subject}`,
        }
      ],
    };

    const interviewDate = customOverrides?.interviewDate || event.interviewDate;
    if (event.proposedAction === 'SCHEDULE_INTERVIEW' || event.eventType === 'INTERVIEW_INVITATION' || interviewDate) {
      newAppPayload.upcomingInterview = {
        id: `int-${Date.now()}`,
        applicationId: '', // set after creation
        companyName: newAppPayload.company,
        role: newAppPayload.role,
        date: interviewDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        time: customOverrides?.interviewTime || event.interviewTime || '14:00',
        roundType: 'Technical Round 1',
        meetingLink: customOverrides?.meetingLink || event.meetingLink || '',
        interviewer: event.recruiterName || 'Recruiter',
        notes: `Scheduled from email: ${event.subject}`,
        completed: false,
      };
    }

    finalApp = await repo.createApplication(userId, newAppPayload);
  }

  // Update Gmail Event status
  const updatedEvent = await repo.updateGmailEvent(userId, eventId, {
    reviewStatus: 'APPROVED',
    appliedAt: new Date().toISOString(),
    matchedApplicationId: finalApp.id,
    matchedApplicationCompany: finalApp.company,
    matchedApplicationRole: finalApp.role,
  });

  return {
    success: true,
    event: updatedEvent || event,
    application: finalApp,
    message: matchedApp ? `Successfully updated ${finalApp.company} status to ${finalApp.status}` : `Created new application for ${finalApp.company} (${finalApp.role})`,
  };
}

export async function dismissGmailEvent(userId: string, eventId: string): Promise<GmailClassifiedEvent> {
  const updated = await repo.updateGmailEvent(userId, eventId, {
    reviewStatus: 'DISMISSED',
    dismissedAt: new Date().toISOString(),
  });
  if (!updated) {
    throw new Error('Gmail event not found');
  }
  return updated;
}
