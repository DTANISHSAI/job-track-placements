import { LocalResume, ResumeAnalysisResult } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker from reliable CDN
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch (workerErr) {
  console.warn('PDF.js worker initialization notice:', workerErr);
}

const DB_NAME = 'JobTrackerResumeDB';
const STORE_NAME = 'resumes';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'resumeId' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result as IDBDatabase);
      };

      request.onerror = (event: any) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  return dbPromise;
}

export const localResumeStore = {
  // Save or update local resume in browser IndexedDB
  async saveResume(resume: LocalResume): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // If this resume is set as default, unset other resumes for the user
      if (resume.isDefault && resume.userId) {
        const req = store.getAll();
        req.onsuccess = () => {
          const items: LocalResume[] = req.result || [];
          items.forEach(item => {
            if (item.userId === resume.userId && item.resumeId !== resume.resumeId && item.isDefault) {
              item.isDefault = false;
              store.put(item);
            }
          });
          store.put(resume);
        };
      } else {
        store.put(resume);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // Get a single resume by ID
  async getResume(resumeId: string): Promise<LocalResume | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(resumeId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  // Get all resumes stored locally for this user
  async getAllResumes(userId?: string): Promise<LocalResume[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        let results: LocalResume[] = request.result || [];
        if (userId) {
          results = results.filter(r => !r.userId || r.userId === userId);
        }
        // Sort descending by updated/created date
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // Rename a resume
  async renameResume(resumeId: string, newName: string): Promise<LocalResume | null> {
    const resume = await this.getResume(resumeId);
    if (!resume) return null;

    resume.name = newName.trim();
    resume.updatedAt = new Date().toISOString();
    await this.saveResume(resume);
    return resume;
  },

  // Delete a resume from local storage
  async deleteResume(resumeId: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(resumeId);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // Set default resume
  async setDefaultResume(resumeId: string, userId?: string): Promise<void> {
    const all = await this.getAllResumes(userId);
    for (const r of all) {
      r.isDefault = r.resumeId === resumeId;
      r.updatedAt = new Date().toISOString();
      await this.saveResume(r);
    }
  },

  // Save AI Analysis results locally
  async saveAnalysis(resumeId: string, analysis: ResumeAnalysisResult): Promise<void> {
    const resume = await this.getResume(resumeId);
    if (!resume) return;

    resume.analysis = analysis;
    resume.updatedAt = new Date().toISOString();
    await this.saveResume(resume);
  },

  // Trigger download of locally stored resume
  downloadResume(resume: LocalResume) {
    let url = resume.dataUrl;
    let cleanup = false;

    if (!url && resume.fileBlob) {
      const blob = typeof resume.fileBlob === 'string'
        ? new Blob([resume.fileBlob], { type: resume.fileType || 'application/pdf' })
        : (resume.fileBlob as Blob);
      url = URL.createObjectURL(blob);
      cleanup = true;
    }

    if (!url) {
      // Fallback: create plain text blob if text exists
      if (resume.textContent) {
        const blob = new Blob([resume.textContent], { type: 'text/plain;charset=utf-8' });
        url = URL.createObjectURL(blob);
        cleanup = true;
      } else {
        throw new Error('Resume file data is unavailable in local browser storage.');
      }
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = resume.fileName || `${resume.name || 'Resume'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (cleanup && url) {
      setTimeout(() => URL.revokeObjectURL(url!), 1000);
    }
  },

  // Helper to extract text and generate preview Data URL from user-uploaded File
  async processUploadedFile(file: File): Promise<{
    textContent: string;
    dataUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        const dataUrl = reader.result as string;
        let textContent = '';

        if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          // Read text directly
          const textReader = new FileReader();
          textReader.onload = () => {
            textContent = textReader.result as string;
            resolve({
              textContent: textContent || `${file.name} - Text Content`,
              dataUrl,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type || 'text/plain',
            });
          };
          textReader.readAsText(file);
        } else if (file.type.includes('pdf') || file.name.endsWith('.pdf')) {
          // Extract real text from PDF using PDF.js or stream fallback
          try {
            const arrayBuffer = await file.arrayBuffer();
            textContent = await extractPdfText(arrayBuffer);
            
            if (!textContent || textContent.trim().length < 20) {
              const basicText = extractPdfTextBasic(arrayBuffer);
              if (basicText && basicText.length > 20) {
                textContent = basicText;
              }
            }
          } catch (err) {
            console.warn('PDF text extraction notice:', err);
          }

          resolve({
            textContent: textContent || '',
            dataUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/pdf',
          });
        } else {
          // Word / Other documents
          textContent = `[Document: ${file.name}]\n` +
            `Type: ${file.type || 'Document'}\n` +
            `Size: ${(file.size / 1024).toFixed(1)} KB\n` +
            `Candidate Resume Profile for Placement Application.`;

          resolve({
            textContent,
            dataUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/octet-stream',
          });
        }
      };

      reader.onerror = () => reject(new Error('Failed to read resume file.'));
      reader.readAsDataURL(file);
    });
  },

  // Remove any previously seeded default/sample resumes
  async removeSampleResumes(userId?: string): Promise<string[]> {
    const all = await this.getAllResumes(userId);
    const removedIds: string[] = [];
    for (const r of all) {
      const isSample = 
        r.resumeId.startsWith('res-sample-') ||
        r.fileName === 'Shaurya_Vardhan_SWE_Resume.pdf' ||
        r.name.includes('Shaurya Vardhan') ||
        r.name.includes('SDE Resume (2026)');
      
      if (isSample) {
        await this.deleteResume(r.resumeId);
        removedIds.push(r.resumeId);
      }
    }
    return removedIds;
  }
};

// High-accuracy PDF Text Extractor using PDF.js
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items
        .map((item: any) => (item.str ? item.str : ''))
        .filter((s: string) => s.trim().length > 0)
        .join(' ');
      if (pageStr.trim()) {
        pageTexts.push(pageStr.trim());
      }
    }

    return pageTexts.join('\n\n').trim();
  } catch (err) {
    console.warn('PDF.js text parsing error, attempting stream fallback:', err);
    return '';
  }
}

// Simple text stream extractor from PDF ArrayBuffer
function extractPdfTextBasic(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }

    const textPieces: string[] = [];
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match;

    while ((match = streamRegex.exec(str)) !== null) {
      const streamContent = match[1];
      const tjMatches = streamContent.match(/\((.*?)\)\s*Tj/g) || streamContent.match(/\[(.*?)\]\s*TJ/g);
      if (tjMatches) {
        tjMatches.forEach(m => {
          const cleaned = m.replace(/^\(|\)\s*Tj$/g, '').replace(/[\\()]/g, '');
          if (cleaned.length > 1) textPieces.push(cleaned);
        });
      }
    }

    return textPieces.join(' ').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}
