import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Sparkles,
  Download,
  Eye,
  Trash2,
  Edit2,
  Star,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Calendar,
  Layers,
  Search,
  Plus,
  Info,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { LocalResume, ResumeMetadata } from '../types';
import { localResumeStore } from '../services/localResumeStore';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ResumeAnalyzerModal } from './ResumeAnalyzerModal';
import { ResumePreviewModal } from './ResumePreviewModal';

interface ResumeManagementViewProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ResumeManagementView: React.FC<ResumeManagementViewProps> = ({ showToast }) => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [resumes, setResumes] = useState<LocalResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [targetRenameResume, setTargetRenameResume] = useState<LocalResume | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteResume, setTargetDeleteResume] = useState<LocalResume | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedResumeForAnalysis, setSelectedResumeForAnalysis] = useState<LocalResume | null>(null);
  const [isAnalyzerModalOpen, setIsAnalyzerModalOpen] = useState(false);

  const [selectedResumeForPreview, setSelectedResumeForPreview] = useState<LocalResume | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadIsDefault, setUploadIsDefault] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load resumes from IndexedDB and sync with server metadata
  const loadLocalResumes = async () => {
    if (!userId) {
      setResumes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Clean up any previously seeded sample/default demo resumes
      const cleanedSampleIds = await localResumeStore.removeSampleResumes(userId);
      for (const sampleId of cleanedSampleIds) {
        try {
          await api.deleteResumeMetadata(sampleId);
        } catch {
          // ignore cleanup errors
        }
      }

      const localList = await localResumeStore.getAllResumes(userId);
      setResumes(localList);

      // Optionally sync metadata with backend
      try {
        const metaRes = await api.getResumesMetadata();
        if (metaRes && metaRes.resumes) {
          // Clean up server sample metadata if any remained
          for (const sMeta of metaRes.resumes) {
            if (sMeta.resumeId.startsWith('res-sample-') || sMeta.fileName === 'Shaurya_Vardhan_SWE_Resume.pdf') {
              try {
                await api.deleteResumeMetadata(sMeta.resumeId);
              } catch {
                // ignore
              }
            }
          }

          // If server has metadata not present in IndexedDB or vice-versa, keep local synced
          for (const local of localList) {
            const hasMeta = metaRes.resumes.some(m => m.resumeId === local.resumeId);
            if (!hasMeta) {
              await api.createResumeMetadata({
                resumeId: local.resumeId,
                name: local.name,
                fileName: local.fileName,
                createdAt: local.createdAt,
                updatedAt: local.updatedAt,
                isDefault: local.isDefault,
              });
            }
          }
        }
      } catch (syncErr) {
        console.warn('Metadata server sync skipped (offline or unauthenticated):', syncErr);
      }
    } catch (err: any) {
      console.error('Failed to load local resumes:', err);
      showToast('Error loading local resume storage.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocalResumes();
  }, [userId]);

  // Handle File Selection
  const handleFileChange = (file: File) => {
    setUploadFile(file);
    if (!uploadName) {
      // derive clean name from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  // Submit Upload
  const handleSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a resume file to upload.', 'error');
      return;
    }

    setIsProcessingUpload(true);
    try {
      const processed = await localResumeStore.processUploadedFile(uploadFile);
      const resumeId = 'res-' + crypto.randomUUID().slice(0, 8);
      const now = new Date().toISOString();

      const newResume: LocalResume = {
        resumeId,
        userId,
        name: uploadName.trim() || uploadFile.name,
        fileName: processed.fileName,
        fileType: processed.fileType,
        fileSize: processed.fileSize,
        dataUrl: processed.dataUrl,
        textContent: processed.textContent,
        isDefault: uploadIsDefault || resumes.length === 0,
        createdAt: now,
        updatedAt: now,
      };

      // 1. Save Full Data locally in Browser IndexedDB
      await localResumeStore.saveResume(newResume);

      // 2. Save ONLY metadata in MongoDB / Server DB
      try {
        await api.createResumeMetadata({
          resumeId: newResume.resumeId,
          name: newResume.name,
          fileName: newResume.fileName,
          createdAt: newResume.createdAt,
          updatedAt: newResume.updatedAt,
          isDefault: newResume.isDefault,
        });
      } catch (metaErr) {
        console.warn('Could not sync metadata to server:', metaErr);
      }

      showToast(`Resume "${newResume.name}" stored locally!`);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadName('');
      setUploadIsDefault(false);
      await loadLocalResumes();
    } catch (err: any) {
      console.error('Upload processing error:', err);
      showToast(err.message || 'Failed to process resume file.', 'error');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Open Delete Confirmation Modal
  const openDeleteConfirmation = (resume: LocalResume) => {
    setTargetDeleteResume(resume);
    setIsDeleteModalOpen(true);
  };

  // Perform Delete Resume
  const handleConfirmDelete = async () => {
    if (!targetDeleteResume) return;

    setIsDeleting(true);
    try {
      // 1. Delete locally from IndexedDB
      await localResumeStore.deleteResume(targetDeleteResume.resumeId);

      // 2. Delete server metadata
      try {
        await api.deleteResumeMetadata(targetDeleteResume.resumeId);
      } catch (e) {
        console.warn('Server metadata delete skipped:', e);
      }

      showToast(`Deleted "${targetDeleteResume.name}" from local browser storage.`);
      setIsDeleteModalOpen(false);
      setTargetDeleteResume(null);
      await loadLocalResumes();
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast('Failed to delete resume.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Set Default Resume
  const handleSetDefault = async (resume: LocalResume) => {
    try {
      await localResumeStore.setDefaultResume(resume.resumeId, userId);
      try {
        await api.setDefaultResumeMetadata(resume.resumeId);
      } catch (e) {
        console.warn('Server metadata default update skipped:', e);
      }
      showToast(`"${resume.name}" set as your default resume.`);
      await loadLocalResumes();
    } catch (err: any) {
      showToast('Failed to set default resume.', 'error');
    }
  };

  // Rename Resume
  const handleOpenRename = (resume: LocalResume) => {
    setTargetRenameResume(resume);
    setRenameInput(resume.name);
    setIsRenameModalOpen(true);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRenameResume || !renameInput.trim()) return;

    try {
      await localResumeStore.renameResume(targetRenameResume.resumeId, renameInput.trim());
      try {
        await api.updateResumeMetadata(targetRenameResume.resumeId, { name: renameInput.trim() });
      } catch (e) {
        console.warn('Server metadata rename skipped:', e);
      }

      showToast('Resume renamed successfully.');
      setIsRenameModalOpen(false);
      setTargetRenameResume(null);
      await loadLocalResumes();
    } catch (err: any) {
      showToast('Failed to rename resume.', 'error');
    }
  };

  // Trigger Local Download
  const handleDownload = (resume: LocalResume) => {
    try {
      localResumeStore.downloadResume(resume);
      showToast(`Downloading "${resume.fileName || resume.name}"`);
    } catch (err: any) {
      showToast('Download failed.', 'error');
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (resume: LocalResume) => {
    setSelectedResumeForPreview(resume);
    setIsPreviewModalOpen(true);
  };

  // Open AI Analyzer Modal
  const handleOpenAnalyzer = (resume: LocalResume) => {
    setSelectedResumeForAnalysis(resume);
    setIsAnalyzerModalOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filteredResumes = resumes.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E1] p-12 text-center space-y-4">
        <FileText className="w-12 h-12 text-[#A3A3A3] mx-auto" />
        <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">Sign In Required</h3>
        <p className="text-xs text-[#737373]">Please sign in or register to view, upload, and manage your placement resumes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. MANDATORY COMMUNICATION BANNER: Privacy & Browser Local Storage Notice */}
      <div 
        id="resume-storage-disclaimer-banner"
        className="bg-[#FCFCFA] rounded-xl border border-amber-200/80 p-4 sm:p-5 shadow-xs bg-gradient-to-r from-amber-50/60 via-[#FCFCFA] to-amber-50/30 flex items-start gap-3.5"
      >
        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
          <HardDrive className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Browser-Only Local Storage Notice
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Zero Cloud File Storage
            </span>
          </div>
          <p className="text-xs text-[#525252] leading-relaxed font-sans">
            <strong className="text-[#1A1A1A]">Your resume is stored locally in this browser and is not permanently stored on our server.</strong> If you clear browser storage or cache, the local resume file can be lost. Only basic sync metadata (title & filename) is kept in the database.
          </p>
        </div>
      </div>

      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Resume Management & AI Analyzer</h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Store multiple placement resumes locally, inspect ATS scores, and tailor applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
            <input
              type="text"
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-[#E5E5E1] text-[#1A1A1A] placeholder-[#A3A3A3] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
            />
          </div>

          <button
            id="upload-new-resume-btn"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Resume</span>
          </button>
        </div>
      </div>

      {/* 3. Resume Cards Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#737373]">Loading local browser resume store...</p>
        </div>
      ) : filteredResumes.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E5E1] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#F0F0EC] text-[#737373] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-serif font-bold text-[#1A1A1A]">No Resumes Stored Locally</h3>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Upload your PDF or Word resume. It will be stored safely in your browser storage and analyzed with Gemini AI.
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Your First Resume</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResumes.map((resume) => {
            const hasAnalysis = Boolean(resume.analysis);
            const score = resume.analysis?.overallScore;
            const atsScore = resume.analysis?.atsScore;

            return (
              <div
                key={resume.resumeId}
                id={`resume-card-${resume.resumeId}`}
                className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between p-5 relative shadow-xs hover:shadow-sm ${
                  resume.isDefault ? 'border-[#1A1A1A] ring-1 ring-[#1A1A1A]/10' : 'border-[#E5E5E1] hover:border-[#CCCCCC]'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-[#F0F0EC] text-[#1A1A1A] flex items-center justify-center shrink-0 border border-[#E5E5E1]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-[#1A1A1A] line-clamp-1" title={resume.name}>
                            {resume.name}
                          </h3>
                        </div>
                        <p className="text-[11px] font-mono text-[#737373] truncate max-w-[170px]" title={resume.fileName}>
                          {resume.fileName}
                        </p>
                      </div>
                    </div>

                    {resume.isDefault ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" /> Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(resume)}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F0F0EC] text-[#737373] hover:text-[#1A1A1A] hover:bg-[#E5E5E1] transition-colors cursor-pointer shrink-0"
                        title="Click to set as default resume"
                      >
                        Set Default
                      </button>
                    )}
                  </div>

                  {/* Metadata line */}
                  <div className="flex items-center gap-3 text-[11px] text-[#737373] pt-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> {formatFileSize(resume.fileSize)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* AI Score Badge / Prompt */}
                  <div className="pt-2">
                    {hasAnalysis && score !== undefined ? (
                      <button
                        onClick={() => handleOpenAnalyzer(resume)}
                        className="w-full text-left p-2.5 rounded-lg bg-purple-50/60 border border-purple-200/80 hover:bg-purple-100/60 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-purple-950">AI Score: {score}/100</div>
                            <div className="text-[10px] text-purple-700">ATS Match: {atsScore}% • Click to inspect</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-purple-900 uppercase tracking-wider bg-purple-100 px-2 py-0.5 rounded">
                          View Report
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenAnalyzer(resume)}
                        className="w-full py-2 px-3 rounded-lg bg-[#F0F0EC] hover:bg-[#E5E5E1] text-[#1A1A1A] text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-[#E5E5E1]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Run AI Resume Analysis</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Bottom Toolbar */}
                <div className="mt-4 pt-3 border-t border-[#E5E5E1] flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenPreview(resume)}
                      className="p-1.5 rounded-md text-[#525252] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
                      title="Preview Resume"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(resume)}
                      className="p-1.5 rounded-md text-[#525252] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
                      title="Download Local Copy"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenRename(resume)}
                      className="p-1.5 rounded-md text-[#525252] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
                      title="Rename Resume"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    id={`delete-resume-btn-${resume.resumeId}`}
                    onClick={() => openDeleteConfirmation(resume)}
                    className="p-1.5 rounded-md text-[#737373] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Resume from Browser"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Upload Resume Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E5E5E1] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E1]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#1A1A1A]">Upload Resume (Local Storage)</h3>
                  <p className="text-[11px] text-[#737373]">Files stay strictly on your device.</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="p-6 space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-[#1A1A1A] bg-[#F0F0EC]' : uploadFile ? 'border-emerald-400 bg-emerald-50/30' : 'border-[#E5E5E1] hover:border-[#1A1A1A] bg-[#FCFCFA]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                {uploadFile ? (
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                      <Check className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#1A1A1A] truncate max-w-xs mx-auto">{uploadFile.name}</p>
                    <p className="text-[11px] text-[#737373]">{formatFileSize(uploadFile.size)} • Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#F0F0EC] text-[#525252] flex items-center justify-center mx-auto">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1A1A1A]">Click to upload or drag and drop</p>
                      <p className="text-[11px] text-[#737373]">PDF, DOCX, or TXT (Max 15MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Resume Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#525252] uppercase tracking-wider">
                  Resume Title / Friendly Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SDE 1 Full Stack Resume"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-[#E5E5E1] text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                />
              </div>

              {/* Checkbox: Make Default */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={uploadIsDefault}
                  onChange={(e) => setUploadIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1A1A1A] focus:ring-0 cursor-pointer accent-[#1A1A1A]"
                />
                <span className="text-xs text-[#525252]">Set as default resume for placement applications</span>
              </label>

              {/* Privacy footnote */}
              <div className="p-3 bg-[#F0F0EC]/60 rounded-lg text-[11px] text-[#737373] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>Your file is processed locally and stored exclusively in this browser.</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#525252] hover:bg-[#F0F0EC] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isProcessingUpload}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-[#333] rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isProcessingUpload ? 'Storing in Browser...' : 'Save Resume'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Rename Modal */}
      {isRenameModalOpen && targetRenameResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E5E5E1] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E1]">
              <h3 className="text-sm font-serif font-bold text-[#1A1A1A]">Rename Resume</h3>
              <button
                onClick={() => setIsRenameModalOpen(false)}
                className="p-1.5 rounded-lg text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#525252] uppercase tracking-wider">
                  Resume Title
                </label>
                <input
                  type="text"
                  required
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-[#E5E5E1] text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  autoFocus
                />
                <p className="text-[11px] text-[#737373]">Original filename: {targetRenameResume.fileName}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#525252] hover:bg-[#F0F0EC] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!renameInput.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-[#333] rounded-lg cursor-pointer shadow-xs"
                >
                  Save Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {isDeleteModalOpen && targetDeleteResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E5E5E1] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-serif font-bold text-[#1A1A1A]">Delete Local Resume?</h3>
                  <p className="text-xs text-[#737373] leading-relaxed">
                    Are you sure you want to delete <strong className="text-[#1A1A1A]">"{targetDeleteResume.name}"</strong> ({targetDeleteResume.fileName})?
                  </p>
                </div>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200/80 text-[11px] text-rose-800 leading-normal flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  This will permanently remove the resume file and its AI analysis report from your local browser IndexedDB storage.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setTargetDeleteResume(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-[#525252] hover:bg-[#F0F0EC] rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-resume-btn"
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Resume'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. AI Resume Analyzer Modal */}
      <ResumeAnalyzerModal
        isOpen={isAnalyzerModalOpen}
        onClose={() => setIsAnalyzerModalOpen(false)}
        resume={selectedResumeForAnalysis}
        onDelete={openDeleteConfirmation}
        onAnalysisUpdated={(updated) => {
          setSelectedResumeForAnalysis(updated);
          loadLocalResumes();
        }}
        showToast={showToast}
      />

      {/* 8. Resume Preview Modal */}
      <ResumePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        resume={selectedResumeForPreview}
        onDelete={openDeleteConfirmation}
        onOpenAnalyzer={(r) => {
          setIsPreviewModalOpen(false);
          handleOpenAnalyzer(r);
        }}
        showToast={showToast}
      />
    </div>
  );
};
