import React, { useState } from 'react';
import {
  X,
  Download,
  Sparkles,
  FileText,
  HardDrive,
  Calendar,
  Layers,
  CheckCircle2,
  Eye,
  FileCode,
  Trash2
} from 'lucide-react';
import { LocalResume } from '../types';
import { localResumeStore } from '../services/localResumeStore';

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: LocalResume | null;
  onOpenAnalyzer: (resume: LocalResume) => void;
  onDelete?: (resume: LocalResume) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  isOpen,
  onClose,
  resume,
  onOpenAnalyzer,
  onDelete,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'document' | 'rawText'>('document');

  if (!isOpen || !resume) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    try {
      localResumeStore.downloadResume(resume);
      showToast(`Downloading ${resume.fileName || resume.name}`);
    } catch (err: any) {
      showToast('Failed to download resume.', 'error');
    }
  };

  const isPdf = resume.fileType.includes('pdf') || resume.fileName.endsWith('.pdf');
  const hasDataUrl = Boolean(resume.dataUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="resume-preview-modal"
        className="bg-[#FCFCFA] rounded-xl border border-[#E5E5E1] shadow-2xl w-full max-w-4xl h-[88vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E1] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] text-[#FCFCFA] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#FCFCFA]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-[#1A1A1A] truncate max-w-md">
                  {resume.name}
                </h2>
                {resume.isDefault && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Default Resume
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#737373] mt-0.5">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> {formatFileSize(resume.fileSize)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span>•</span>
                <span className="font-mono text-[10px] text-[#525252]">{resume.fileName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAnalyzer(resume)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{resume.analysis ? `AI Score: ${resume.analysis.overallScore}` : 'AI Analyzer'}</span>
            </button>
            <button
              id="download-resume-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            {onDelete && (
              <button
                id="preview-delete-resume-btn"
                onClick={() => {
                  onClose();
                  onDelete(resume);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer shadow-xs"
                title="Delete Resume from Browser"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher (if both PDF preview & extracted text exist) */}
        {hasDataUrl && resume.textContent && (
          <div className="px-6 py-2 bg-[#F0F0EC]/60 border-b border-[#E5E5E1] flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('document')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'document' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#737373] hover:text-[#1A1A1A]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Document View
              </button>
              <button
                onClick={() => setViewMode('rawText')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'rawText' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#737373] hover:text-[#1A1A1A]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" /> Extracted Text (AI Stream)
              </button>
            </div>
            <span className="text-[11px] text-[#737373] hidden sm:block">
              Browser-only local preview
            </span>
          </div>
        )}

        {/* Body / Document Canvas */}
        <div className="flex-1 bg-[#F5F5F0] overflow-hidden p-4 sm:p-6 flex flex-col items-center justify-center">
          {viewMode === 'document' && hasDataUrl && isPdf ? (
            <div className="w-full h-full bg-white rounded-lg border border-[#E5E5E1] shadow-sm overflow-hidden flex flex-col">
              <iframe
                src={resume.dataUrl}
                title={`Preview of ${resume.name}`}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            /* Document formatted text sheet */
            <div className="w-full h-full max-w-3xl bg-white rounded-lg border border-[#E5E5E1] shadow-md overflow-y-auto p-6 sm:p-8 space-y-4">
              <div className="border-b border-[#E5E5E1] pb-4">
                <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">{resume.name}</h3>
                <p className="text-xs text-[#737373] mt-1 font-mono">
                  Filename: {resume.fileName} • {formatFileSize(resume.fileSize)}
                </p>
              </div>

              {resume.textContent ? (
                <div className="text-xs font-mono text-[#333] whitespace-pre-wrap leading-relaxed space-y-2 select-text">
                  {resume.textContent}
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-[#737373] space-y-2">
                  <p>Binary PDF data loaded. Click Download to open directly in your local PDF reader.</p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-lg bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#333] cursor-pointer"
                  >
                    Open PDF File
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-2.5 bg-white border-t border-[#E5E5E1] flex items-center justify-between text-[11px] text-[#737373]">
          <span>Security: Stored strictly in this browser. Not stored on external cloud servers.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-medium text-[#1A1A1A] hover:bg-[#F0F0EC] rounded-md transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
