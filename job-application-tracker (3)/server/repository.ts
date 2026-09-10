import crypto from 'crypto';
import { User, JobApplication, InterviewSchedule, DashboardStats, ApplicationStatus, JobType, InterviewRoundType, ResumeMetadata, GmailClassifiedEvent, GmailSyncSettings } from '../src/types';
import { UserModel, ApplicationModel, ResumeMetadataModel, GmailEventModel, GmailSettingsModel } from './models';
import { db as fileDb, hashPassword } from './db';
import { isMongoActive } from './mongo';

export async function findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | undefined> {
  if (isMongoActive()) {
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    if (!doc) return undefined;
    return {
      id: doc.id,
      name: doc.name,
      email: doc.email,
      studentId: doc.studentId,
      college: doc.college,
      graduationYear: doc.graduationYear,
      branch: doc.branch,
      cgpa: doc.cgpa,
      phone: doc.phone,
      bio: doc.bio,
      resumeUrl: doc.resumeUrl,
      skills: doc.skills,
      codingProfiles: doc.codingProfiles,
      internships: doc.internships,
      certifications: doc.certifications,
      passwordHash: doc.passwordHash,
    };
  }
  return fileDb.findUserByEmail(email);
}

export async function findUserById(id: string): Promise<User | undefined> {
  if (isMongoActive()) {
    const doc = await UserModel.findOne({ id });
    if (!doc) return undefined;
    return {
      id: doc.id,
      name: doc.name,
      email: doc.email,
      studentId: doc.studentId,
      college: doc.college,
      graduationYear: doc.graduationYear,
      branch: doc.branch,
      cgpa: doc.cgpa,
      phone: doc.phone,
      bio: doc.bio,
      resumeUrl: doc.resumeUrl,
      skills: doc.skills,
      codingProfiles: doc.codingProfiles,
      internships: doc.internships,
      certifications: doc.certifications,
    };
  }
  return fileDb.findUserById(id);
}

export async function updateUserProfile(id: string, updateData: Partial<User>): Promise<User | undefined> {
  if (isMongoActive()) {
    const doc = await UserModel.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    );
    if (!doc) return undefined;
    return {
      id: doc.id,
      name: doc.name,
      email: doc.email,
      studentId: doc.studentId,
      college: doc.college,
      graduationYear: doc.graduationYear,
      branch: doc.branch,
      cgpa: doc.cgpa,
      phone: doc.phone,
      bio: doc.bio,
      resumeUrl: doc.resumeUrl,
      skills: doc.skills,
      codingProfiles: doc.codingProfiles,
      internships: doc.internships,
      certifications: doc.certifications,
    };
  }
  return fileDb.updateUser(id, updateData);
}

export async function updateUserPassword(email: string, newPasswordPlain: string): Promise<boolean> {
  const pwdHash = hashPassword(newPasswordPlain);
  if (isMongoActive()) {
    const doc = await UserModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { passwordHash: pwdHash } },
      { new: true }
    );
    return !!doc;
  }
  return fileDb.updateUserPassword(email, newPasswordPlain);
}

export async function createUser(userData: Omit<User, 'id'> & { password: string }): Promise<User> {
  if (isMongoActive()) {
    const userId = 'user-' + crypto.randomUUID().slice(0, 8);
    const pwdHash = hashPassword(userData.password);
    
    // Check if user already exists
    const existingDoc = await UserModel.findOne({ email: userData.email.toLowerCase() });
    if (existingDoc) {
      return {
        id: existingDoc.id,
        name: existingDoc.name,
        email: existingDoc.email,
        studentId: existingDoc.studentId,
        college: existingDoc.college,
        graduationYear: existingDoc.graduationYear,
        branch: existingDoc.branch,
        cgpa: existingDoc.cgpa,
        phone: existingDoc.phone,
        bio: existingDoc.bio,
        resumeUrl: existingDoc.resumeUrl,
        skills: existingDoc.skills,
        codingProfiles: existingDoc.codingProfiles,
        internships: existingDoc.internships,
        certifications: existingDoc.certifications,
      };
    }

    const doc = await UserModel.create({
      id: userId,
      name: userData.name,
      email: userData.email.toLowerCase(),
      studentId: userData.studentId || '',
      college: userData.college || 'Engineering Institute',
      graduationYear: userData.graduationYear || '2026',
      branch: userData.branch || 'Computer Science',
      cgpa: userData.cgpa,
      phone: userData.phone || '',
      bio: userData.bio || '',
      resumeUrl: userData.resumeUrl || '',
      skills: userData.skills || [],
      codingProfiles: userData.codingProfiles || {},
      internships: userData.internships || [],
      certifications: userData.certifications || [],
      passwordHash: pwdHash,
    });

    return {
      id: doc.id,
      name: doc.name,
      email: doc.email,
      studentId: doc.studentId,
      college: doc.college,
      graduationYear: doc.graduationYear,
      branch: doc.branch,
      cgpa: doc.cgpa,
      phone: doc.phone,
      bio: doc.bio,
      resumeUrl: doc.resumeUrl,
      skills: doc.skills,
      codingProfiles: doc.codingProfiles,
      internships: doc.internships,
      certifications: doc.certifications,
    };
  }
  return fileDb.createUser(userData);
}

async function seedMongoUserApplications(userId: string) {
  try {
    const sampleApps = fileDb.getAllApplicationsInternal().filter(a => a.userId === 'demo-student-id-101');
    if (!sampleApps || sampleApps.length === 0) return;

    for (let idx = 0; idx < sampleApps.length; idx++) {
      const app = sampleApps[idx];
      await ApplicationModel.create({
        id: `app-${userId}-${idx + 1}`,
        userId,
        company: app.company,
        role: app.role,
        packageLPA: app.packageLPA,
        currency: app.currency || '₹',
        applicationDate: app.applicationDate,
        status: app.status || 'Applied',
        jobType: app.jobType || 'Full Time',
        location: app.location || 'Bengaluru, India',
        jobLink: app.jobLink || '',
        referral: app.referral || '',
        notes: app.notes || '',
        upcomingInterview: app.upcomingInterview ? {
          id: `int-${userId}-${idx + 1}`,
          date: app.upcomingInterview.date,
          time: app.upcomingInterview.time || '',
          roundType: app.upcomingInterview.roundType || 'Technical Round 1',
          meetingLink: app.upcomingInterview.meetingLink || '',
          interviewer: app.upcomingInterview.interviewer || '',
          notes: app.upcomingInterview.notes || '',
          completed: app.upcomingInterview.completed || false,
        } : undefined,
        history: app.history || [
          { status: app.status || 'Applied', date: app.applicationDate, note: 'Initial application submitted' }
        ],
      });
    }
  } catch (err) {
    console.warn('[MongoDB] Seeding user apps skipped due to error:', err);
  }
}

export async function getApplications(userId: string, search?: string, status?: string): Promise<JobApplication[]> {
  if (isMongoActive()) {
    const query: any = { userId };
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { company: regex },
        { role: regex },
        { location: regex },
        { notes: regex },
      ];
    }
    const docs = await ApplicationModel.find(query).sort({ updatedAt: -1, applicationDate: -1 });
    return docs.map(doc => {
      const obj = (doc as any).toObject ? (doc as any).toObject() : doc;
      return {
        id: obj.id,
        userId: obj.userId,
        company: obj.company,
        role: obj.role,
        packageLPA: obj.packageLPA,
        currency: '₹',
        applicationDate: obj.applicationDate,
        status: obj.status as ApplicationStatus,
        jobType: obj.jobType as JobType,
        location: obj.location,
        jobLink: obj.jobLink,
        referral: obj.referral,
        notes: obj.notes,
        upcomingInterview: obj.upcomingInterview ? {
          id: obj.upcomingInterview.id,
          applicationId: obj.id,
          companyName: obj.company,
          role: obj.role,
          date: obj.upcomingInterview.date,
          time: obj.upcomingInterview.time || '',
          roundType: obj.upcomingInterview.roundType as InterviewRoundType,
          meetingLink: obj.upcomingInterview.meetingLink,
          interviewer: obj.upcomingInterview.interviewer,
          notes: obj.upcomingInterview.notes,
          completed: obj.upcomingInterview.completed,
        } : undefined,
        history: [],
        createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString(),
      };
    });
  }
  return fileDb.getApplications(userId, search, status);
}

export const getApplicationsByUserId = getApplications;

export async function createApplication(userId: string, appData: Partial<JobApplication>): Promise<JobApplication> {
  if (isMongoActive()) {
    const id = 'app-' + crypto.randomUUID().slice(0, 8);
    const doc = await ApplicationModel.create({
      id,
      userId,
      company: appData.company?.trim() || 'Untitled Company',
      role: appData.role?.trim() || 'Software Engineer',
      packageLPA: Number(appData.packageLPA) || 0,
      applicationDate: appData.applicationDate || new Date().toISOString().split('T')[0],
      status: appData.status || 'Applied',
      jobType: appData.jobType || 'Full Time',
      location: appData.location || 'Bengaluru, India',
      jobLink: appData.jobLink || '',
      referral: appData.referral || '',
      notes: appData.notes || '',
      upcomingInterview: appData.upcomingInterview ? {
        id: appData.upcomingInterview.id || 'int-' + crypto.randomUUID().slice(0, 8),
        date: appData.upcomingInterview.date,
        time: appData.upcomingInterview.time || '',
        roundType: appData.upcomingInterview.roundType || 'Technical Round 1',
        meetingLink: appData.upcomingInterview.meetingLink || '',
        interviewer: appData.upcomingInterview.interviewer || '',
        notes: appData.upcomingInterview.notes || '',
        completed: false,
      } : undefined,
    });
    const obj = (doc as any).toObject ? (doc as any).toObject() : doc;
    return {
      id: obj.id,
      userId: obj.userId,
      company: obj.company,
      role: obj.role,
      packageLPA: obj.packageLPA,
      currency: '₹',
      applicationDate: obj.applicationDate,
      status: obj.status,
      jobType: obj.jobType,
      location: obj.location,
      jobLink: obj.jobLink,
      referral: obj.referral,
      notes: obj.notes,
      upcomingInterview: obj.upcomingInterview ? {
        id: obj.upcomingInterview.id,
        applicationId: obj.id,
        companyName: obj.company,
        role: obj.role,
        date: obj.upcomingInterview.date,
        time: obj.upcomingInterview.time || '',
        roundType: obj.upcomingInterview.roundType,
        meetingLink: obj.upcomingInterview.meetingLink,
        interviewer: obj.upcomingInterview.interviewer,
        notes: obj.upcomingInterview.notes,
        completed: obj.upcomingInterview.completed,
      } : undefined,
      history: [],
      createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
  return fileDb.createApplication(userId, appData);
}

export async function updateApplication(id: string, userId: string, updates: Partial<JobApplication>): Promise<JobApplication | null> {
  if (isMongoActive()) {
    const doc = await ApplicationModel.findOne({ id, userId });
    if (!doc) return null;

    if (updates.company !== undefined) doc.company = updates.company.trim();
    if (updates.role !== undefined) doc.role = updates.role.trim();
    if (updates.packageLPA !== undefined) doc.packageLPA = Number(updates.packageLPA) || 0;
    if (updates.applicationDate !== undefined) doc.applicationDate = updates.applicationDate;
    if (updates.status !== undefined) doc.status = updates.status;
    if (updates.jobType !== undefined) doc.jobType = updates.jobType;
    if (updates.location !== undefined) doc.location = updates.location;
    if (updates.jobLink !== undefined) doc.jobLink = updates.jobLink;
    if (updates.referral !== undefined) doc.referral = updates.referral;
    if (updates.notes !== undefined) doc.notes = updates.notes;
    if (updates.upcomingInterview !== undefined) {
      doc.upcomingInterview = updates.upcomingInterview ? {
        id: updates.upcomingInterview.id || 'int-' + crypto.randomUUID().slice(0, 8),
        date: updates.upcomingInterview.date,
        time: updates.upcomingInterview.time || '',
        roundType: updates.upcomingInterview.roundType,
        meetingLink: updates.upcomingInterview.meetingLink || '',
        interviewer: updates.upcomingInterview.interviewer || '',
        notes: updates.upcomingInterview.notes || '',
        completed: updates.upcomingInterview.completed || false,
      } : undefined;
    }

    await doc.save();
    const obj = (doc as any).toObject ? (doc as any).toObject() : doc;
    return {
      id: obj.id,
      userId: obj.userId,
      company: obj.company,
      role: obj.role,
      packageLPA: obj.packageLPA,
      currency: '₹',
      applicationDate: obj.applicationDate,
      status: obj.status,
      jobType: obj.jobType,
      location: obj.location,
      jobLink: obj.jobLink,
      referral: obj.referral,
      notes: obj.notes,
      upcomingInterview: obj.upcomingInterview ? {
        id: obj.upcomingInterview.id,
        applicationId: obj.id,
        companyName: obj.company,
        role: obj.role,
        date: obj.upcomingInterview.date,
        time: obj.upcomingInterview.time || '',
        roundType: obj.upcomingInterview.roundType,
        meetingLink: obj.upcomingInterview.meetingLink,
        interviewer: obj.upcomingInterview.interviewer,
        notes: obj.upcomingInterview.notes,
        completed: obj.upcomingInterview.completed,
      } : undefined,
      history: [],
      createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
  return fileDb.updateApplication(id, userId, updates);
}

export async function deleteApplication(id: string, userId: string): Promise<boolean> {
  if (isMongoActive()) {
    const res = await ApplicationModel.deleteOne({ id, userId });
    return (res.deletedCount || 0) > 0;
  }
  return fileDb.deleteApplication(id, userId);
}

export async function getInterviews(userId: string): Promise<InterviewSchedule[]> {
  if (isMongoActive()) {
    const apps = await ApplicationModel.find({ userId, upcomingInterview: { $ne: null } });
    const list: InterviewSchedule[] = [];
    for (const app of apps) {
      if (app.upcomingInterview && app.upcomingInterview.date) {
        list.push({
          id: app.upcomingInterview.id,
          applicationId: app.id,
          companyName: app.company,
          role: app.role,
          date: app.upcomingInterview.date,
          time: app.upcomingInterview.time || '',
          roundType: app.upcomingInterview.roundType as InterviewRoundType,
          meetingLink: app.upcomingInterview.meetingLink,
          interviewer: app.upcomingInterview.interviewer,
          notes: app.upcomingInterview.notes,
          completed: app.upcomingInterview.completed,
        });
      }
    }
    return list.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return dateA - dateB;
    });
  }
  return fileDb.getInterviews(userId);
}

export async function saveInterview(userId: string, interview: InterviewSchedule): Promise<JobApplication | null> {
  if (isMongoActive()) {
    const app = await ApplicationModel.findOne({ id: interview.applicationId, userId });
    if (!app) return null;

    app.upcomingInterview = {
      id: interview.id || 'int-' + crypto.randomUUID().slice(0, 8),
      date: interview.date,
      time: interview.time || '',
      roundType: interview.roundType,
      meetingLink: interview.meetingLink || '',
      interviewer: interview.interviewer || '',
      notes: interview.notes || '',
      completed: interview.completed || false,
    };

    if (app.status === 'Applied' || app.status === 'Assessment') {
      app.status = 'Interview';
    }

    await app.save();
    const obj = (app as any).toObject ? (app as any).toObject() : app;
    return {
      id: obj.id,
      userId: obj.userId,
      company: obj.company,
      role: obj.role,
      packageLPA: obj.packageLPA,
      currency: '₹',
      applicationDate: obj.applicationDate,
      status: obj.status,
      jobType: obj.jobType,
      location: obj.location,
      jobLink: obj.jobLink,
      referral: obj.referral,
      notes: obj.notes,
      upcomingInterview: {
        id: obj.upcomingInterview.id,
        applicationId: obj.id,
        companyName: obj.company,
        role: obj.role,
        date: obj.upcomingInterview.date,
        time: obj.upcomingInterview.time || '',
        roundType: obj.upcomingInterview.roundType,
        meetingLink: obj.upcomingInterview.meetingLink,
        interviewer: obj.upcomingInterview.interviewer,
        notes: obj.upcomingInterview.notes,
        completed: obj.upcomingInterview.completed,
      },
      history: [],
      createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
  return fileDb.saveInterview(userId, interview);
}

export async function deleteInterview(userId: string, applicationId: string): Promise<JobApplication | null> {
  if (isMongoActive()) {
    const app = await ApplicationModel.findOne({ id: applicationId, userId });
    if (!app) return null;

    app.upcomingInterview = undefined;
    await app.save();
    const obj = (app as any).toObject ? (app as any).toObject() : app;
    return {
      id: obj.id,
      userId: obj.userId,
      company: obj.company,
      role: obj.role,
      packageLPA: obj.packageLPA,
      currency: '₹',
      applicationDate: obj.applicationDate,
      status: obj.status,
      jobType: obj.jobType,
      location: obj.location,
      jobLink: obj.jobLink,
      referral: obj.referral,
      notes: obj.notes,
      upcomingInterview: undefined,
      history: [],
      createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
  return fileDb.deleteInterview(userId, applicationId);
}

export async function getStats(userId: string): Promise<DashboardStats> {
  if (isMongoActive()) {
    const userApps = await ApplicationModel.find({ userId });
    const total = userApps.length;
    const appliedCount = userApps.filter(a => a.status === 'Applied').length;
    const assessmentCount = userApps.filter(a => a.status === 'Assessment').length;
    const interviewCount = userApps.filter(a => a.status === 'Interview').length;
    const selectedCount = userApps.filter(a => a.status === 'Selected').length;
    const rejectedCount = userApps.filter(a => a.status === 'Rejected').length;

    const packages = userApps.map(a => a.packageLPA || 0).filter(p => p > 0);
    const highestPackage = packages.length > 0 ? Math.max(...packages) : 0;
    const averagePackage = packages.length > 0 ? Math.round((packages.reduce((sum, p) => sum + p, 0) / packages.length) * 10) / 10 : 0;

    const interviews = await getInterviews(userId);
    const upcomingInterviews = interviews.filter(i => !i.completed && new Date(`${i.date}T${i.time || '23:59'}`) >= new Date());

    const activeResponses = assessmentCount + interviewCount + selectedCount;
    const responseRate = total > 0 ? Math.round((activeResponses / total) * 100) : 0;
    const selectionRate = total > 0 ? Math.round((selectedCount / total) * 100) : 0;

    return {
      totalApplications: total,
      appliedCount,
      assessmentCount,
      interviewCount,
      selectedCount,
      rejectedCount,
      highestPackage,
      averagePackage,
      totalOffers: selectedCount,
      upcomingInterviewsCount: upcomingInterviews.length,
      responseRate,
      selectionRate,
    };
  }
  return fileDb.getStats(userId);
}

export async function resetToDefault(userId: string) {
  if (isMongoActive()) {
    await ApplicationModel.deleteMany({ userId });
    await seedMongoUserApplications(userId);
    return getApplications(userId);
  }
  return fileDb.resetToDefault(userId);
}

// ==================== RESUME METADATA METHODS ====================
// Note: Actual resume file blobs are stored browser-side only in IndexedDB.
// MongoDB stores strictly metadata (resumeId, userId, name, fileName, createdAt, updatedAt, analysisId, isDefault)

export async function getResumesMetadata(userId: string): Promise<ResumeMetadata[]> {
  if (isMongoActive()) {
    const docs = await ResumeMetadataModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map(d => ({
      resumeId: d.resumeId,
      userId: d.userId,
      name: d.name,
      fileName: d.fileName,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      analysisId: d.analysisId || undefined,
      isDefault: !!d.isDefault,
    }));
  }
  return fileDb.getResumesMetadata(userId);
}

export async function createResumeMetadata(userId: string, data: Omit<ResumeMetadata, 'userId'>): Promise<ResumeMetadata> {
  if (isMongoActive()) {
    if (data.isDefault) {
      await ResumeMetadataModel.updateMany({ userId }, { $set: { isDefault: false } });
    }

    // Check if this is the first resume for this user
    const count = await ResumeMetadataModel.countDocuments({ userId });
    const isFirst = count === 0;

    const resumeId = data.resumeId || 'res-' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    const doc = await ResumeMetadataModel.findOneAndUpdate(
      { userId, resumeId },
      {
        $set: {
          name: data.name || 'Student Resume',
          fileName: data.fileName || 'resume.pdf',
          updatedAt: data.updatedAt || now,
          analysisId: data.analysisId || '',
          isDefault: isFirst || !!data.isDefault,
        },
        $setOnInsert: {
          resumeId,
          userId,
          createdAt: data.createdAt || now,
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      resumeId: doc.resumeId,
      userId: doc.userId,
      name: doc.name,
      fileName: doc.fileName,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      analysisId: doc.analysisId || undefined,
      isDefault: doc.isDefault,
    };
  }
  return fileDb.createResumeMetadata(userId, data);
}

export async function updateResumeMetadata(userId: string, resumeId: string, updates: Partial<ResumeMetadata>): Promise<ResumeMetadata | undefined> {
  if (isMongoActive()) {
    if (updates.isDefault) {
      await ResumeMetadataModel.updateMany({ userId }, { $set: { isDefault: false } });
    }
    const updatePayload: any = { updatedAt: new Date().toISOString() };
    if (updates.name !== undefined) updatePayload.name = updates.name.trim();
    if (updates.fileName !== undefined) updatePayload.fileName = updates.fileName;
    if (updates.analysisId !== undefined) updatePayload.analysisId = updates.analysisId;
    if (updates.isDefault !== undefined) updatePayload.isDefault = updates.isDefault;

    const doc = await ResumeMetadataModel.findOneAndUpdate(
      { userId, resumeId },
      { $set: updatePayload },
      { new: true }
    );
    if (!doc) return undefined;
    return {
      resumeId: doc.resumeId,
      userId: doc.userId,
      name: doc.name,
      fileName: doc.fileName,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      analysisId: doc.analysisId || undefined,
      isDefault: doc.isDefault,
    };
  }
  return fileDb.updateResumeMetadata(userId, resumeId, updates);
}

export async function deleteResumeMetadata(userId: string, resumeId: string): Promise<boolean> {
  if (isMongoActive()) {
    const result = await ResumeMetadataModel.deleteOne({ userId, resumeId });
    return result.deletedCount > 0;
  }
  return fileDb.deleteResumeMetadata(userId, resumeId);
}

export async function setDefaultResumeMetadata(userId: string, resumeId: string): Promise<boolean> {
  if (isMongoActive()) {
    await ResumeMetadataModel.updateMany({ userId }, { $set: { isDefault: false } });
    const res = await ResumeMetadataModel.updateOne({ userId, resumeId }, { $set: { isDefault: true, updatedAt: new Date().toISOString() } });
    return res.modifiedCount > 0;
  }
  return fileDb.setDefaultResumeMetadata(userId, resumeId);
}

// ==================== GMAIL EVENT & SETTINGS REPOSITORY ====================

export async function getGmailEvents(userId: string): Promise<GmailClassifiedEvent[]> {
  if (isMongoActive()) {
    const docs = await GmailEventModel.find({ userId }).sort({ receivedDate: -1 });
    return docs.map(d => ({
      id: d.id,
      userId: d.userId,
      messageId: d.messageId,
      threadId: d.threadId,
      subject: d.subject,
      from: d.from,
      to: d.to,
      receivedDate: d.receivedDate,
      snippet: d.snippet,
      isJobRelated: d.isJobRelated,
      eventType: d.eventType as any,
      companyName: d.companyName,
      jobTitle: d.jobTitle,
      recruiterName: d.recruiterName,
      recruiterEmail: d.recruiterEmail,
      interviewDate: d.interviewDate,
      interviewTime: d.interviewTime,
      meetingLink: d.meetingLink,
      assessmentDeadline: d.assessmentDeadline,
      confidence: d.confidence,
      explanation: d.explanation,
      matchedApplicationId: d.matchedApplicationId,
      matchedApplicationCompany: d.matchedApplicationCompany,
      matchedApplicationRole: d.matchedApplicationRole,
      currentApplicationStatus: d.currentApplicationStatus as any,
      proposedAction: d.proposedAction as any,
      proposedStatus: d.proposedStatus as any,
      reviewStatus: d.reviewStatus as any,
      appliedAt: d.appliedAt,
      dismissedAt: d.dismissedAt,
      createdAt: d.createdAt,
    }));
  }
  return fileDb.getGmailEvents(userId);
}

export async function getGmailEventById(userId: string, id: string): Promise<GmailClassifiedEvent | undefined> {
  if (isMongoActive()) {
    const d = await GmailEventModel.findOne({ id, userId });
    if (!d) return undefined;
    return {
      id: d.id,
      userId: d.userId,
      messageId: d.messageId,
      threadId: d.threadId,
      subject: d.subject,
      from: d.from,
      to: d.to,
      receivedDate: d.receivedDate,
      snippet: d.snippet,
      isJobRelated: d.isJobRelated,
      eventType: d.eventType as any,
      companyName: d.companyName,
      jobTitle: d.jobTitle,
      recruiterName: d.recruiterName,
      recruiterEmail: d.recruiterEmail,
      interviewDate: d.interviewDate,
      interviewTime: d.interviewTime,
      meetingLink: d.meetingLink,
      assessmentDeadline: d.assessmentDeadline,
      confidence: d.confidence,
      explanation: d.explanation,
      matchedApplicationId: d.matchedApplicationId,
      matchedApplicationCompany: d.matchedApplicationCompany,
      matchedApplicationRole: d.matchedApplicationRole,
      currentApplicationStatus: d.currentApplicationStatus as any,
      proposedAction: d.proposedAction as any,
      proposedStatus: d.proposedStatus as any,
      reviewStatus: d.reviewStatus as any,
      appliedAt: d.appliedAt,
      dismissedAt: d.dismissedAt,
      createdAt: d.createdAt,
    };
  }
  return fileDb.getGmailEventById(userId, id);
}

export async function saveGmailEvent(
  userId: string,
  eventData: Omit<GmailClassifiedEvent, 'id' | 'userId' | 'createdAt'>
): Promise<GmailClassifiedEvent> {
  if (isMongoActive()) {
    const existing = await GmailEventModel.findOne({ userId, messageId: eventData.messageId });
    if (existing) {
      Object.assign(existing, eventData);
      await existing.save();
      return {
        id: existing.id,
        userId: existing.userId,
        messageId: existing.messageId,
        threadId: existing.threadId,
        subject: existing.subject,
        from: existing.from,
        to: existing.to,
        receivedDate: existing.receivedDate,
        snippet: existing.snippet,
        isJobRelated: existing.isJobRelated,
        eventType: existing.eventType as any,
        companyName: existing.companyName,
        jobTitle: existing.jobTitle,
        recruiterName: existing.recruiterName,
        recruiterEmail: existing.recruiterEmail,
        interviewDate: existing.interviewDate,
        interviewTime: existing.interviewTime,
        meetingLink: existing.meetingLink,
        assessmentDeadline: existing.assessmentDeadline,
        confidence: existing.confidence,
        explanation: existing.explanation,
        matchedApplicationId: existing.matchedApplicationId,
        matchedApplicationCompany: existing.matchedApplicationCompany,
        matchedApplicationRole: existing.matchedApplicationRole,
        currentApplicationStatus: existing.currentApplicationStatus as any,
        proposedAction: existing.proposedAction as any,
        proposedStatus: existing.proposedStatus as any,
        reviewStatus: existing.reviewStatus as any,
        appliedAt: existing.appliedAt,
        dismissedAt: existing.dismissedAt,
        createdAt: existing.createdAt,
      };
    }

    const newId = `gme-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const doc = await GmailEventModel.create({
      ...eventData,
      id: newId,
      userId,
      createdAt,
    });

    return {
      id: doc.id,
      userId: doc.userId,
      messageId: doc.messageId,
      threadId: doc.threadId,
      subject: doc.subject,
      from: doc.from,
      to: doc.to,
      receivedDate: doc.receivedDate,
      snippet: doc.snippet,
      isJobRelated: doc.isJobRelated,
      eventType: doc.eventType as any,
      companyName: doc.companyName,
      jobTitle: doc.jobTitle,
      recruiterName: doc.recruiterName,
      recruiterEmail: doc.recruiterEmail,
      interviewDate: doc.interviewDate,
      interviewTime: doc.interviewTime,
      meetingLink: doc.meetingLink,
      assessmentDeadline: doc.assessmentDeadline,
      confidence: doc.confidence,
      explanation: doc.explanation,
      matchedApplicationId: doc.matchedApplicationId,
      matchedApplicationCompany: doc.matchedApplicationCompany,
      matchedApplicationRole: doc.matchedApplicationRole,
      currentApplicationStatus: doc.currentApplicationStatus as any,
      proposedAction: doc.proposedAction as any,
      proposedStatus: doc.proposedStatus as any,
      reviewStatus: doc.reviewStatus as any,
      appliedAt: doc.appliedAt,
      dismissedAt: doc.dismissedAt,
      createdAt: doc.createdAt,
    };
  }
  return fileDb.saveGmailEvent(userId, eventData);
}

export async function updateGmailEvent(
  userId: string,
  id: string,
  updates: Partial<GmailClassifiedEvent>
): Promise<GmailClassifiedEvent | undefined> {
  if (isMongoActive()) {
    const doc = await GmailEventModel.findOneAndUpdate(
      { id, userId },
      { $set: updates },
      { new: true }
    );
    if (!doc) return undefined;
    return {
      id: doc.id,
      userId: doc.userId,
      messageId: doc.messageId,
      threadId: doc.threadId,
      subject: doc.subject,
      from: doc.from,
      to: doc.to,
      receivedDate: doc.receivedDate,
      snippet: doc.snippet,
      isJobRelated: doc.isJobRelated,
      eventType: doc.eventType as any,
      companyName: doc.companyName,
      jobTitle: doc.jobTitle,
      recruiterName: doc.recruiterName,
      recruiterEmail: doc.recruiterEmail,
      interviewDate: doc.interviewDate,
      interviewTime: doc.interviewTime,
      meetingLink: doc.meetingLink,
      assessmentDeadline: doc.assessmentDeadline,
      confidence: doc.confidence,
      explanation: doc.explanation,
      matchedApplicationId: doc.matchedApplicationId,
      matchedApplicationCompany: doc.matchedApplicationCompany,
      matchedApplicationRole: doc.matchedApplicationRole,
      currentApplicationStatus: doc.currentApplicationStatus as any,
      proposedAction: doc.proposedAction as any,
      proposedStatus: doc.proposedStatus as any,
      reviewStatus: doc.reviewStatus as any,
      appliedAt: doc.appliedAt,
      dismissedAt: doc.dismissedAt,
      createdAt: doc.createdAt,
    };
  }
  return fileDb.updateGmailEvent(userId, id, updates);
}

export async function getGmailSettings(userId: string): Promise<GmailSyncSettings> {
  if (isMongoActive()) {
    let settingsDoc = await GmailSettingsModel.findOne({ userId });
    if (!settingsDoc) {
      settingsDoc = await GmailSettingsModel.create({
        userId,
        autoSyncHighConfidence: false,
        minConfidenceThreshold: 0.90,
        connectedEmail: '',
        isConnected: false,
        lastSyncedAt: '',
      });
    }

    const totalEvents = await GmailEventModel.countDocuments({ userId });
    const pendingCount = await GmailEventModel.countDocuments({ userId, reviewStatus: 'PENDING_REVIEW', isJobRelated: true });

    return {
      autoSyncHighConfidence: settingsDoc.autoSyncHighConfidence,
      minConfidenceThreshold: settingsDoc.minConfidenceThreshold,
      connectedEmail: settingsDoc.connectedEmail,
      isConnected: settingsDoc.isConnected,
      lastSyncedAt: settingsDoc.lastSyncedAt,
      totalEventsDetected: totalEvents,
      pendingReviewCount: pendingCount,
    };
  }
  return fileDb.getGmailSettings(userId);
}

export async function updateGmailSettings(userId: string, updates: Partial<GmailSyncSettings>): Promise<GmailSyncSettings> {
  if (isMongoActive()) {
    const doc = await GmailSettingsModel.findOneAndUpdate(
      { userId },
      { $set: updates },
      { upsert: true, new: true }
    );

    const totalEvents = await GmailEventModel.countDocuments({ userId });
    const pendingCount = await GmailEventModel.countDocuments({ userId, reviewStatus: 'PENDING_REVIEW', isJobRelated: true });

    return {
      autoSyncHighConfidence: doc.autoSyncHighConfidence,
      minConfidenceThreshold: doc.minConfidenceThreshold,
      connectedEmail: doc.connectedEmail,
      isConnected: doc.isConnected,
      lastSyncedAt: doc.lastSyncedAt,
      totalEventsDetected: totalEvents,
      pendingReviewCount: pendingCount,
    };
  }
  return fileDb.updateGmailSettings(userId, updates);
}


