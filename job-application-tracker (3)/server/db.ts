import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { JobApplication, User, InterviewSchedule, DashboardStats, ResumeMetadata, GmailClassifiedEvent, GmailSyncSettings } from '../src/types';

interface DatabaseSchema {
  users: Array<User & { passwordHash: string }>;
  applications: JobApplication[];
  resumesMetadata?: ResumeMetadata[];
  gmailEvents?: GmailClassifiedEvent[];
  gmailSettings?: Record<string, GmailSyncSettings>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Initial seed data generator
function getInitialSeedData(): DatabaseSchema {
  const demoUserId = 'demo-student-id-101';
  const defaultUser: User & { passwordHash: string } = {
    id: demoUserId,
    name: 'Shaurya Vardhan',
    email: 'shaurya@campus.edu',
    studentId: '21BCE10482',
    college: 'IISC Bangalore',
    graduationYear: '2026',
    branch: 'Computer Science & Engineering',
    cgpa: 9.15,
    phone: '+91 98765 43210',
    bio: 'Competitive programmer & Full-Stack developer passionate about Distributed Systems, High-Performance Backend APIs, and Data Structures.',
    resumeUrl: 'https://drive.google.com/file/d/sample-resume/view',
    skills: ['Java', 'C++', 'Python', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Redis'],
    codingProfiles: {
      leetcode: 'https://leetcode.com/u/shauryavardhan_dev',
      linkedin: 'https://linkedin.com/in/shauryavardhan',
      codechef: 'shauryavardhan',
      hackerrank: 'shaurya_campus',
      codeforces: 'shauryav',
      github: 'https://github.com/shauryavardhan',
      portfolio: 'https://shauryavardhan.dev',
    },
    internships: [
      {
        id: 'int-exp-01',
        companyName: 'Cisco Systems',
        role: 'Software Engineer Intern',
        duration: 'May 2024 - Jul 2024 (2 months)',
        location: 'Bengaluru (On-site)',
        keyLearnings: 'Optimized network telemetry pipelines using Go and Kafka, reducing event latency by 28%. Built automated unit test suites.',
        certificateUrl: 'https://drive.google.com/file/d/sample-cisco-cert/view'
      },
      {
        id: 'int-exp-02',
        companyName: 'TechCorp Solutions',
        role: 'Full Stack Web Developer Intern',
        duration: 'Dec 2023 - Jan 2024 (1 month)',
        location: 'Remote',
        keyLearnings: 'Implemented role-based authentication and interactive dashboard metrics using React, Tailwind CSS, and Node.js.',
        certificateUrl: 'https://drive.google.com/file/d/sample-techcorp-cert/view'
      }
    ],
    certifications: [
      {
        id: 'cert-01',
        title: 'Infosys Springboard AI & Java Specialization',
        issuer: 'Infosys Springboard',
        issueDate: 'Aug 2024',
        credentialId: 'INF-SP-2024-9981',
        credentialUrl: 'https://infyspringboard.onwingspan.com/certificate/view/sample'
      },
      {
        id: 'cert-02',
        title: 'IBM SkillsBuild Enterprise Cloud Computing',
        issuer: 'IBM SkillsBuild',
        issueDate: 'Jun 2024',
        credentialId: 'IBM-SB-77218',
        credentialUrl: 'https://skillsbuild.org/credentials/sample'
      },
      {
        id: 'cert-03',
        title: 'AWS Certified Cloud Practitioner (CLF-C02)',
        issuer: 'Amazon Web Services',
        issueDate: 'Jan 2024',
        credentialId: 'AWS-CCP-882910',
        credentialUrl: 'https://aws.amazon.com/verification'
      }
    ],
    passwordHash: hashPassword('password'),
  };

  const sampleApplications: JobApplication[] = [
    {
      id: 'app-001',
      userId: demoUserId,
      company: 'Google',
      role: 'Software Development Engineer - I',
      packageLPA: 38.5,
      currency: '₹',
      applicationDate: '2026-08-12',
      status: 'Interview',
      jobType: 'Full Time',
      location: 'Bengaluru / Hyderabad (Hybrid)',
      jobLink: 'https://careers.google.com/jobs/results/12345',
      referral: 'Referred by Senior SDE-2 (Alumni)',
      notes: 'Focus on Distributed Systems, Graphs, and DP problems. Passed online coding assessment with 100% score.',
      upcomingInterview: {
        id: 'int-001',
        applicationId: 'app-001',
        companyName: 'Google',
        role: 'Software Development Engineer - I',
        date: '2026-09-04',
        time: '14:30',
        roundType: 'Technical Round 2',
        meetingLink: 'https://meet.google.com/abc-wxyz-pqr',
        interviewer: 'Alex Vance (Tech Lead, Cloud Infrastructure)',
        notes: 'Prepare Google Docs architecture breakdown and Trie data structure optimization.',
        completed: false
      },
      history: [
        { status: 'Applied', date: '2026-08-12', note: 'Applied through College Placement Portal with referral' },
        { status: 'Assessment', date: '2026-08-18', note: 'Completed 2 LC hard coding assessment problems' },
        { status: 'Interview', date: '2026-08-25', note: 'Cleared Technical Round 1 on binary trees & graphs' },
      ],
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: 'app-002',
      userId: demoUserId,
      company: 'Microsoft',
      role: 'Software Engineer (Azure Platform)',
      packageLPA: 44.0,
      currency: '₹',
      applicationDate: '2026-08-05',
      status: 'Selected',
      jobType: 'Full Time',
      location: 'Hyderabad, India',
      jobLink: 'https://careers.microsoft.com/us/en/job/98765',
      referral: 'On-Campus Placement Drive',
      notes: 'Received official offer letter! Final round with Partner Director cleared. Joining in July 2026.',
      history: [
        { status: 'Applied', date: '2026-08-05', note: 'On-campus placement cell registration' },
        { status: 'Assessment', date: '2026-08-10', note: 'Codility OA cleared' },
        { status: 'Interview', date: '2026-08-17', note: '3 technical rounds + 1 AA round completed' },
        { status: 'Selected', date: '2026-08-22', note: 'Offer accepted with joining bonus and stock options' },
      ],
      createdAt: new Date(Date.now() - 27 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
    {
      id: 'app-003',
      userId: demoUserId,
      company: 'Atlassian',
      role: 'Associate Software Engineer',
      packageLPA: 52.0,
      currency: '₹',
      applicationDate: '2026-08-15',
      status: 'Interview',
      jobType: 'Full Time',
      location: 'Bengaluru (Remote First)',
      jobLink: 'https://atlassian.com/careers/ase-india',
      referral: 'Employee Referral',
      notes: 'Values interview coming up. Focus on "Open Company, No Bullshit" & "Play as a Team".',
      upcomingInterview: {
        id: 'int-002',
        applicationId: 'app-003',
        companyName: 'Atlassian',
        role: 'Associate Software Engineer',
        date: '2026-09-02',
        time: '11:00',
        roundType: 'System Design',
        meetingLink: 'https://zoom.us/j/9182736450',
        interviewer: 'Rohan Sharma (Principal Engineer)',
        notes: 'Revise Low Level Design for Rate Limiter and Collaborative Document Editor.',
        completed: false
      },
      history: [
        { status: 'Applied', date: '2026-08-15', note: 'Applied directly via off-campus careers portal' },
        { status: 'Assessment', date: '2026-08-20', note: 'HackerRank coding + work simulation test' },
        { status: 'Interview', date: '2026-08-28', note: 'Completed coding round (Concurrency & caching)' }
      ],
      createdAt: new Date(Date.now() - 17 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'app-004',
      userId: demoUserId,
      company: 'Goldman Sachs',
      role: 'Analyst (Global Markets Division)',
      packageLPA: 26.0,
      currency: '₹',
      applicationDate: '2026-08-01',
      status: 'Selected',
      jobType: '6M Intern + FTE',
      location: 'Bengaluru, India',
      jobLink: 'https://goldmansachs.com/careers/analyst',
      notes: 'Offer letter received! PPO conversion opportunity. 6 months internship + FTE confirmed.',
      history: [
        { status: 'Applied', date: '2026-08-01', note: 'Registered on on-campus portal' },
        { status: 'Assessment', date: '2026-08-07', note: 'Math, quant aptitude + 2 coding questions' },
        { status: 'Interview', date: '2026-08-14', note: '3 rounds on Core CS, OS, OOP, and Puzzles' },
        { status: 'Selected', date: '2026-08-19', note: 'Offer received' }
      ],
      createdAt: new Date(Date.now() - 31 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: 'app-005',
      userId: demoUserId,
      company: 'Amazon',
      role: 'Software Development Engineer - AWS',
      packageLPA: 32.0,
      currency: '₹',
      applicationDate: '2026-08-10',
      status: 'Assessment',
      jobType: 'Full Time',
      location: 'Hyderabad / Chennai',
      jobLink: 'https://amazon.jobs/en/jobs/24589',
      notes: 'Amazon OA completed on August 24. Awaiting interview schedule confirmation for Amazon Leadership Principles round.',
      history: [
        { status: 'Applied', date: '2026-08-10', note: 'Applied with campus pool' },
        { status: 'Assessment', date: '2026-08-24', note: 'Submitted OA 1 (Debugging) & OA 2 (Work Styles)' }
      ],
      createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'app-006',
      userId: demoUserId,
      company: 'Flipkart',
      role: 'UI Engineer (Frontend & Mobile)',
      packageLPA: 24.5,
      currency: '₹',
      applicationDate: '2026-08-18',
      status: 'Assessment',
      jobType: 'Full Time',
      location: 'Bengaluru, India',
      jobLink: 'https://flipkartcareers.com/job/frontend-2026',
      notes: 'Take home machine coding round due next Tuesday. Building an interactive e-commerce filter widget in React.',
      history: [
        { status: 'Applied', date: '2026-08-18', note: 'Applied via Flipkart GRiD hackathon fast track' },
        { status: 'Assessment', date: '2026-08-27', note: 'Received Machine Coding Assignment' }
      ],
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'app-007',
      userId: demoUserId,
      company: 'Adobe',
      role: 'Product Development Engineer',
      packageLPA: 34.0,
      currency: '₹',
      applicationDate: '2026-08-03',
      status: 'Rejected',
      jobType: 'Full Time',
      location: 'Noida / Bengaluru',
      jobLink: 'https://adobe.com/careers/pde',
      notes: 'Reached Round 2. Good learning on memory management and C++ smart pointers.',
      history: [
        { status: 'Applied', date: '2026-08-03', note: 'Campus drive application' },
        { status: 'Assessment', date: '2026-08-08', note: 'Online test cleared' },
        { status: 'Interview', date: '2026-08-16', note: 'Completed Round 1' },
        { status: 'Rejected', date: '2026-08-21', note: 'Position closed with alternate candidate' }
      ],
      createdAt: new Date(Date.now() - 29 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: 'app-008',
      userId: demoUserId,
      company: 'Oracle',
      role: 'Server Technologies Engineer',
      packageLPA: 21.0,
      currency: '₹',
      applicationDate: '2026-08-26',
      status: 'Applied',
      jobType: 'Full Time',
      location: 'Bengaluru / Pune',
      jobLink: 'https://oracle.com/careers/student',
      notes: 'Application submitted on college portal. Shortlist announcement expected by September 5.',
      history: [
        { status: 'Applied', date: '2026-08-26', note: 'Initial resume submission and GPA verification' }
      ],
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: 'app-009',
      userId: demoUserId,
      company: 'Uber',
      role: 'Backend Software Engineer',
      packageLPA: 48.0,
      currency: '₹',
      applicationDate: '2026-08-28',
      status: 'Applied',
      jobType: 'Internship',
      location: 'Hyderabad, India',
      jobLink: 'https://uber.com/careers/swe-intern',
      referral: 'Referred by Tech Lead',
      notes: 'Application in initial screening stage. Follow up with recruiter if no update in 2 weeks.',
      history: [
        { status: 'Applied', date: '2026-08-28', note: 'Submitted via Referral link' }
      ],
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    }
  ];

  return {
    users: [defaultUser],
    applications: sampleApplications,
  };
}

export function hashPassword(pwd: string): string {
  return crypto.createHash('sha256').update(pwd + '_jobtracker_salt').digest('hex');
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.users && parsed.applications) {
          if (!parsed.resumesMetadata) parsed.resumesMetadata = [];
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading database file, initializing defaults:', e);
    }
    const seed = getInitialSeedData();
    seed.resumesMetadata = [];
    this.saveDataDirect(seed);
    return seed;
  }

  private saveData() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database directly:', e);
    }
  }

  // User methods
  public getAllUsersInternal(): Array<User & { passwordHash: string }> {
    return this.data.users;
  }

  public getAllApplicationsInternal(): JobApplication[] {
    return this.data.applications;
  }

  public findUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return undefined;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  public updateUser(id: string, updateData: Partial<User>): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return undefined;

    if (updateData.name !== undefined) user.name = updateData.name;
    if (updateData.studentId !== undefined) user.studentId = updateData.studentId;
    if (updateData.college !== undefined) user.college = updateData.college;
    if (updateData.branch !== undefined) user.branch = updateData.branch;
    if (updateData.graduationYear !== undefined) user.graduationYear = updateData.graduationYear;
    if (updateData.cgpa !== undefined) user.cgpa = updateData.cgpa;
    if (updateData.phone !== undefined) user.phone = updateData.phone;
    if (updateData.bio !== undefined) user.bio = updateData.bio;
    if (updateData.resumeUrl !== undefined) user.resumeUrl = updateData.resumeUrl;
    if (updateData.skills !== undefined) user.skills = updateData.skills;
    if (updateData.codingProfiles !== undefined) {
      user.codingProfiles = {
        ...(user.codingProfiles || {}),
        ...updateData.codingProfiles
      };
    }
    if (updateData.internships !== undefined) user.internships = updateData.internships;
    if (updateData.certifications !== undefined) user.certifications = updateData.certifications;

    this.saveData();
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  public updateUserPassword(email: string, newPasswordPlain: string): boolean {
    const user = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    user.passwordHash = hashPassword(newPasswordPlain);
    this.saveData();
    return true;
  }

  public createUser(userData: Omit<User, 'id'> & { password: string }): User {
    const newUser: User & { passwordHash: string } = {
      id: 'user-' + crypto.randomUUID().slice(0, 8),
      name: userData.name,
      email: userData.email.toLowerCase(),
      college: userData.college || 'Engineering Institute',
      graduationYear: userData.graduationYear || '2026',
      branch: userData.branch || 'Computer Science',
      passwordHash: hashPassword(userData.password),
    };
    this.data.users.push(newUser);
    
    // Do NOT seed applications for newly registered users - start fresh
    this.saveData();
    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  }

  public seedUserApplications(userId: string, userName?: string) {
    const seedData = getInitialSeedData();
    const clonedApps = seedData.applications.map((app, idx) => ({
      ...app,
      id: `app-${userId}-${idx + 1}`,
      userId: userId,
      upcomingInterview: app.upcomingInterview ? {
        ...app.upcomingInterview,
        id: `int-${userId}-${idx + 1}`,
        applicationId: `app-${userId}-${idx + 1}`,
      } : undefined
    }));

    // Remove any previous apps for this user and push new
    this.data.applications = this.data.applications.filter(a => a.userId !== userId).concat(clonedApps);
    this.saveData();
  }

  // Application methods
  public getApplications(userId: string, search?: string, status?: string): JobApplication[] {
    let list = this.data.applications.filter(a => a.userId === userId);
    
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(a => 
        a.company.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'All') {
      list = list.filter(a => a.status === status);
    }

    // Default sort: latest updated first
    return list.sort((a, b) => new Date(b.updatedAt || b.applicationDate).getTime() - new Date(a.updatedAt || a.applicationDate).getTime());
  }

  public getApplicationById相(id: string, userId: string): JobApplication | undefined {
    return this.data.applications.find(a => a.id === id && a.userId === userId);
  }

  public createApplication(userId: string, appData: Partial<JobApplication>): JobApplication {
    const now = new Date().toISOString();
    const newApp: JobApplication = {
      id: 'app-' + crypto.randomUUID().slice(0, 8),
      userId,
      company: appData.company?.trim() || 'Untitled Company',
      role: appData.role?.trim() || 'Software Engineer',
      packageLPA: Number(appData.packageLPA) || 0,
      currency: appData.currency || '₹',
      applicationDate: appData.applicationDate || new Date().toISOString().split('T')[0],
      status: appData.status || 'Applied',
      jobType: appData.jobType || 'Full Time',
      location: appData.location || 'Bengaluru, India',
      jobLink: appData.jobLink || '',
      referral: appData.referral || '',
      notes: appData.notes || '',
      upcomingInterview: appData.upcomingInterview ? {
        ...appData.upcomingInterview,
        id: appData.upcomingInterview.id || 'int-' + crypto.randomUUID().slice(0, 8),
        applicationId: 'temp',
        companyName: appData.company?.trim() || '',
        role: appData.role?.trim() || '',
      } : undefined,
      history: [
        {
          status: appData.status || 'Applied',
          date: appData.applicationDate || new Date().toISOString().split('T')[0],
          note: 'Application added'
        }
      ],
      createdAt: now,
      updatedAt: now,
    };

    if (newApp.upcomingInterview) {
      newApp.upcomingInterview.applicationId = newApp.id;
    }

    this.data.applications.unshift(newApp);
    this.saveData();
    return newApp;
  }

  public updateApplication(id: string, userId: string, updateData: Partial<JobApplication>): JobApplication | null {
    const index = this.data.applications.findIndex(a => a.id === id && a.userId === userId);
    if (index === -1) return null;

    const existing = this.data.applications[index];
    const now = new Date().toISOString();

    const statusChanged = updateData.status && updateData.status !== existing.status;
    const updatedHistory = [...(existing.history || [])];

    if (statusChanged && updateData.status) {
      updatedHistory.push({
        status: updateData.status,
        date: new Date().toISOString().split('T')[0],
        note: `Status updated to ${updateData.status}`
      });
    }

    const updatedApp: JobApplication = {
      ...existing,
      ...updateData,
      id: existing.id,
      userId: existing.userId,
      packageLPA: updateData.packageLPA !== undefined ? Number(updateData.packageLPA) : existing.packageLPA,
      history: updatedHistory,
      updatedAt: now,
    };

    // Keep upcoming interview synced with company and role
    if (updatedApp.upcomingInterview) {
      updatedApp.upcomingInterview.applicationId = updatedApp.id;
      updatedApp.upcomingInterview.companyName = updatedApp.company;
      updatedApp.upcomingInterview.role = updatedApp.role;
    }

    this.data.applications[index] = updatedApp;
    this.saveData();
    return updatedApp;
  }

  public deleteApplication(id: string, userId: string): boolean {
    const initLen = this.data.applications.length;
    this.data.applications = this.data.applications.filter(a => !(a.id === id && a.userId === userId));
    const deleted = this.data.applications.length < initLen;
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }

  // Interview methods
  public getInterviews(userId: string): InterviewSchedule[] {
    const apps = this.data.applications.filter(a => a.userId === userId);
    const interviews: InterviewSchedule[] = [];
    
    for (const app of apps) {
      if (app.upcomingInterview && app.upcomingInterview.date) {
        interviews.push({
          ...app.upcomingInterview,
          applicationId: app.id,
          companyName: app.company,
          role: app.role
        });
      }
    }

    // Sort by interview date and time ascending
    return interviews.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return dateA - dateB;
    });
  }

  public saveInterview(userId: string, interview: InterviewSchedule): JobApplication | null {
    const app = this.data.applications.find(a => a.id === interview.applicationId && a.userId === userId);
    if (!app) return null;

    app.upcomingInterview = {
      ...interview,
      id: interview.id || 'int-' + crypto.randomUUID().slice(0, 8),
      applicationId: app.id,
      companyName: app.company,
      role: app.role,
    };

    // If status wasn't already Interview, automatically move to Interview
    if (app.status === 'Applied' || app.status === 'Assessment') {
      app.status = 'Interview';
      app.history.push({
        status: 'Interview',
        date: new Date().toISOString().split('T')[0],
        note: `Interview round scheduled: ${interview.roundType} on ${interview.date}`
      });
    }

    app.updatedAt = new Date().toISOString();
    this.saveData();
    return app;
  }

  public deleteInterview(userId: string, applicationId: string): JobApplication | null {
    const app = this.data.applications.find(a => a.id === applicationId && a.userId === userId);
    if (!app) return null;

    app.upcomingInterview = undefined;
    app.updatedAt = new Date().toISOString();
    this.saveData();
    return app;
  }

  // Analytics
  public getStats(userId: string): DashboardStats {
    const userApps = this.data.applications.filter(a => a.userId === userId);
    const total = userApps.length;
    const appliedCount = userApps.filter(a => a.status === 'Applied').length;
    const assessmentCount = userApps.filter(a => a.status === 'Assessment').length;
    const interviewCount = userApps.filter(a => a.status === 'Interview').length;
    const selectedCount = userApps.filter(a => a.status === 'Selected').length;
    const rejectedCount = userApps.filter(a => a.status === 'Rejected').length;

    const packages = userApps.map(a => a.packageLPA || 0).filter(p => p > 0);
    const highestPackage = packages.length > 0 ? Math.max(...packages) : 0;
    const averagePackage = packages.length > 0 ? Math.round((packages.reduce((sum, p) => sum + p, 0) / packages.length) * 10) / 10 : 0;

    const interviews = this.getInterviews(userId);
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
      responseRate: responseRate,
      selectionRate,
    };
  }

  public resetToDefault(userId: string) {
    this.seedUserApplications(userId);
    return this.getApplications(userId);
  }

  // Resume Metadata methods (Server stores only metadata, no binary blobs)
  public getResumesMetadata(userId: string): ResumeMetadata[] {
    const list = (this.data.resumesMetadata || []).filter(r => r.userId === userId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createResumeMetadata(userId: string, meta: Omit<ResumeMetadata, 'userId'>): ResumeMetadata {
    if (!this.data.resumesMetadata) this.data.resumesMetadata = [];
    
    // If this is set as default, unset others for this user
    if (meta.isDefault) {
      this.data.resumesMetadata.forEach(r => {
        if (r.userId === userId) r.isDefault = false;
      });
    }

    const resumeId = meta.resumeId || 'res-' + crypto.randomUUID().slice(0, 8);
    const existingIndex = this.data.resumesMetadata.findIndex(r => r.userId === userId && r.resumeId === resumeId);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existingRecord = this.data.resumesMetadata[existingIndex];
      existingRecord.name = meta.name || existingRecord.name;
      existingRecord.fileName = meta.fileName || existingRecord.fileName;
      existingRecord.updatedAt = meta.updatedAt || now;
      if (meta.analysisId !== undefined) existingRecord.analysisId = meta.analysisId;
      if (meta.isDefault !== undefined) existingRecord.isDefault = meta.isDefault;
      this.saveData();
      return existingRecord;
    }

    const countForUser = this.data.resumesMetadata.filter(r => r.userId === userId).length;
    const isFirst = countForUser === 0;

    const newRecord: ResumeMetadata = {
      resumeId,
      userId,
      name: meta.name || 'Student Resume',
      fileName: meta.fileName || 'resume.pdf',
      createdAt: meta.createdAt || now,
      updatedAt: meta.updatedAt || now,
      analysisId: meta.analysisId || '',
      isDefault: isFirst || !!meta.isDefault,
    };

    this.data.resumesMetadata.push(newRecord);
    this.saveData();
    return newRecord;
  }

  public updateResumeMetadata(userId: string, resumeId: string, updates: Partial<ResumeMetadata>): ResumeMetadata | undefined {
    if (!this.data.resumesMetadata) return undefined;
    const item = this.data.resumesMetadata.find(r => r.resumeId === resumeId && r.userId === userId);
    if (!item) return undefined;

    if (updates.isDefault) {
      this.data.resumesMetadata.forEach(r => {
        if (r.userId === userId) r.isDefault = false;
      });
    }

    if (updates.name !== undefined) item.name = updates.name.trim();
    if (updates.fileName !== undefined) item.fileName = updates.fileName;
    if (updates.analysisId !== undefined) item.analysisId = updates.analysisId;
    if (updates.isDefault !== undefined) item.isDefault = updates.isDefault;
    item.updatedAt = new Date().toISOString();

    this.saveData();
    return item;
  }

  public deleteResumeMetadata(userId: string, resumeId: string): boolean {
    if (!this.data.resumesMetadata) return false;
    const initialLen = this.data.resumesMetadata.length;
    this.data.resumesMetadata = this.data.resumesMetadata.filter(r => !(r.resumeId === resumeId && r.userId === userId));
    const deleted = this.data.resumesMetadata.length < initialLen;
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }

  public setDefaultResumeMetadata(userId: string, resumeId: string): boolean {
    if (!this.data.resumesMetadata) return false;
    let found = false;
    this.data.resumesMetadata.forEach(r => {
      if (r.userId === userId) {
        if (r.resumeId === resumeId) {
          r.isDefault = true;
          r.updatedAt = new Date().toISOString();
          found = true;
        } else {
          r.isDefault = false;
        }
      }
    });
    if (found) this.saveData();
    return found;
  }

  // ==================== GMAIL EVENT & SETTINGS METHODS ====================

  public getGmailEvents(userId: string): GmailClassifiedEvent[] {
    if (!this.data.gmailEvents) return [];
    return this.data.gmailEvents
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  }

  public getGmailEventById(userId: string, id: string): GmailClassifiedEvent | undefined {
    if (!this.data.gmailEvents) return undefined;
    return this.data.gmailEvents.find(e => e.id === id && e.userId === userId);
  }

  public getGmailEventByMessageId(userId: string, messageId: string): GmailClassifiedEvent | undefined {
    if (!this.data.gmailEvents) return undefined;
    return this.data.gmailEvents.find(e => e.messageId === messageId && e.userId === userId);
  }

  public saveGmailEvent(userId: string, eventData: Omit<GmailClassifiedEvent, 'id' | 'userId' | 'createdAt'>): GmailClassifiedEvent {
    if (!this.data.gmailEvents) {
      this.data.gmailEvents = [];
    }

    // Check if already exists for this user and messageId
    const existingIndex = this.data.gmailEvents.findIndex(e => e.userId === userId && e.messageId === eventData.messageId);
    
    if (existingIndex >= 0) {
      const existing = this.data.gmailEvents[existingIndex];
      const updated: GmailClassifiedEvent = {
        ...existing,
        ...eventData,
        id: existing.id,
        userId,
        createdAt: existing.createdAt,
      };
      this.data.gmailEvents[existingIndex] = updated;
      this.saveData();
      return updated;
    }

    const newEvent: GmailClassifiedEvent = {
      ...eventData,
      id: `gme-${crypto.randomUUID()}`,
      userId,
      createdAt: new Date().toISOString(),
    };

    this.data.gmailEvents.unshift(newEvent);
    this.saveData();
    return newEvent;
  }

  public updateGmailEvent(userId: string, id: string, updates: Partial<GmailClassifiedEvent>): GmailClassifiedEvent | undefined {
    if (!this.data.gmailEvents) return undefined;
    const item = this.data.gmailEvents.find(e => e.id === id && e.userId === userId);
    if (!item) return undefined;

    Object.assign(item, updates);
    this.saveData();
    return item;
  }

  public getGmailSettings(userId: string): GmailSyncSettings {
    if (!this.data.gmailSettings) {
      this.data.gmailSettings = {};
    }
    const settings = this.data.gmailSettings[userId] || {
      autoSyncHighConfidence: false,
      minConfidenceThreshold: 0.90,
      isConnected: false,
      connectedEmail: '',
    };
    
    const events = this.getGmailEvents(userId);
    const pendingCount = events.filter(e => e.reviewStatus === 'PENDING_REVIEW' && e.isJobRelated).length;
    
    return {
      ...settings,
      totalEventsDetected: events.length,
      pendingReviewCount: pendingCount,
    };
  }

  public updateGmailSettings(userId: string, updates: Partial<GmailSyncSettings>): GmailSyncSettings {
    if (!this.data.gmailSettings) {
      this.data.gmailSettings = {};
    }
    const current = this.data.gmailSettings[userId] || {
      autoSyncHighConfidence: false,
      minConfidenceThreshold: 0.90,
      isConnected: false,
      connectedEmail: '',
    };

    const updated: GmailSyncSettings = {
      ...current,
      ...updates,
    };

    this.data.gmailSettings[userId] = updated;
    this.saveData();
    return this.getGmailSettings(userId);
  }
}

export const db = new Database();
