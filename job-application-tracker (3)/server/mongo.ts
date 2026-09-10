import mongoose from 'mongoose';
import { UserModel, ApplicationModel } from './models';
import { db } from './db';

let isConnected = false;
let mongoDisabled = false;

export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[MongoDB] MONGODB_URI not provided. Running in high-performance local document store mode.');
    return false;
  }

  if (isConnected) return true;

  try {
    console.log('[MongoDB] Connecting to MongoDB instance...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      dbName: 'placement_tracker',
    });
    isConnected = true;
    console.log('[MongoDB] Successfully connected to MongoDB Database!');

    // Cleanup legacy conflicting indexes if present
    try {
      const collections = await mongoose.connection.db?.listCollections({ name: 'resumemetadatas' }).toArray();
      if (collections && collections.length > 0) {
        const indexes = await mongoose.connection.db?.collection('resumemetadatas').indexes();
        if (indexes?.some(i => i.name === 'resumeId_1')) {
          await mongoose.connection.db?.collection('resumemetadatas').dropIndex('resumeId_1');
          console.log('[MongoDB] Cleaned up legacy single-field unique index resumeId_1');
        }
      }
    } catch (idxErr: any) {
      console.warn('[MongoDB] Index cleanup notice:', idxErr.message);
    }

    // Sync seed data to MongoDB if empty
    await syncInitialMongoData();
    return true;
  } catch (err: any) {
    console.error('[MongoDB] Connection failed, falling back to local document store:', err.message);
    mongoDisabled = true;
    return false;
  }
}

async function syncInitialMongoData() {
  try {
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('[MongoDB] Initializing collections with default seed data...');
      const localUsers = db.getAllUsersInternal();
      for (const u of localUsers) {
        await UserModel.create({
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          college: u.college,
          graduationYear: u.graduationYear,
          branch: u.branch,
        });
      }

      const localApps = db.getAllApplicationsInternal();
      for (const a of localApps) {
        await ApplicationModel.create({
          id: a.id,
          userId: a.userId,
          company: a.company,
          role: a.role,
          packageLPA: a.packageLPA,
          applicationDate: a.applicationDate,
          status: a.status,
          jobType: a.jobType,
          location: a.location,
          jobLink: a.jobLink,
          referral: a.referral,
          notes: a.notes,
          upcomingInterview: a.upcomingInterview ? {
            id: a.upcomingInterview.id,
            date: a.upcomingInterview.date,
            time: a.upcomingInterview.time,
            roundType: a.upcomingInterview.roundType,
            meetingLink: a.upcomingInterview.meetingLink,
            interviewer: a.upcomingInterview.interviewer,
            notes: a.upcomingInterview.notes,
            completed: a.upcomingInterview.completed,
          } : undefined,
        });
      }
      console.log('[MongoDB] Initial seed sync complete!');
    }
  } catch (err: any) {
    console.warn('[MongoDB] Seed sync error:', err.message);
  }
}

export function isMongoActive(): boolean {
  return isConnected && !mongoDisabled && mongoose.connection.readyState === 1;
}
