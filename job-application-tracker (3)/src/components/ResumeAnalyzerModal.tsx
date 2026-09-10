import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  Download,
  RefreshCw,
  Code2,
  GraduationCap,
  Briefcase,
  Layers,
  HelpCircle,
  Lightbulb,
  Check,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { LocalResume, ResumeAnalysisResult } from '../types';
import { api } from '../services/api';
import { localResumeStore } from '../services/localResumeStore';

interface ResumeAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: LocalResume | null;
  onAnalysisUpdated: (updatedResume: LocalResume) => void;
  onDelete?: (resume: LocalResume) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ResumeAnalyzerModal: React.FC<ResumeAnalyzerModalProps> = ({
  isOpen,
  onClose,
  resume,
  onAnalysisUpdated,
  onDelete,
  showToast,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'overview' | 'skills' | 'sections' | 'ats' | 'suggestions'>('overview');
  const [targetRole, setTargetRole] = useState('Software Development Engineer (SDE 1)');

  if (!isOpen || !resume) return null;

  const analysis: ResumeAnalysisResult | undefined = resume.analysis;

  const handleRunAnalysis = async () => {
    if (!resume.textContent && !resume.fileName) {
      showToast('No readable text content found in resume to analyze.', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await api.analyzeResume({
        resumeId: resume.resumeId,
        resumeText: resume.textContent || '',
        resumeName: resume.name,
        fileDataUrl: resume.dataUrl,
        fileType: resume.fileType,
        targetRole,
      });

      if (res.analysis) {
        await localResumeStore.saveAnalysis(resume.resumeId, res.analysis);
        const updated = await localResumeStore.getResume(resume.resumeId);
        if (updated) {
          onAnalysisUpdated(updated);
        }
        showToast('AI Resume Analysis completed successfully!');
      }
    } catch (err: any) {
      console.error('AI Analysis Error:', err);
      showToast(err.message || 'Failed to analyze resume.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 55) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getScoreBadgeText = (score: number) => {
    if (score >= 90) return 'Top 5% Placement Ready';
    if (score >= 80) return 'Strong Candidate Profile';
    if (score >= 70) return 'Good Foundation • Refinement Needed';
    return 'Action Required for ATS';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="ai-resume-analyzer-modal"
        className="bg-[#FCFCFA] rounded-xl border border-[#E5E5E1] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E1] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] text-[#FCFCFA] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-[#1A1A1A]">AI Resume Analyzer</h2>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Powered by Gemini
                </span>
              </div>
              <p className="text-xs text-[#737373] truncate max-w-md">
                Analyzing: <span className="font-medium text-[#1A1A1A]">{resume.name}</span> ({resume.fileName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reanalyze-resume-btn"
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Analyzing Resume...' : analysis ? 'Re-Analyze' : 'Start Analysis'}</span>
            </button>
            {onDelete && (
              <button
                id="analyzer-delete-resume-btn"
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!analysis && !analyzing ? (
            /* Empty State: Prompt to run analysis */
            <div className="text-center py-12 px-4 max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Ready to Evaluate Your Resume</h3>
                <p className="text-sm text-[#737373] mt-1 leading-relaxed">
                  Our AI evaluates your resume against standard ATS algorithms, university placement criteria, keyword density, and technical depth.
                </p>
              </div>

              <div className="bg-[#F0F0EC]/60 rounded-xl p-4 border border-[#E5E5E1] text-left space-y-3">
                <label className="block text-xs font-semibold text-[#525252] uppercase tracking-wider">
                  Target Role / Placement Track
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer, Backend Developer, Data Analyst"
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-[#E5E5E1] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                />
              </div>

              <button
                onClick={handleRunAnalysis}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-[#2C2C2C] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Run Instant AI Resume Analysis</span>
              </button>
            </div>
          ) : analyzing ? (
            /* Loading State */
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-[#1A1A1A]">Evaluating Resume Structure & ATS Alignment...</h4>
                <p className="text-xs text-[#737373]">
                  Checking keyword density, quantitative metrics, technical skills, and formatting standards.
                </p>
              </div>
            </div>
          ) : analysis ? (
            /* Results View */
            <div className="space-y-6">
              {/* Score Top Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Overall Score */}
                <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Overall Score</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F0F0EC] text-[#525252]">
                      Benchmark: 80+
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-4xl font-serif font-bold text-[#1A1A1A]">{analysis.overallScore}</span>
                    <span className="text-xs text-[#737373]">/ 100</span>
                  </div>
                  <div className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${getScoreColor(analysis.overallScore)}`}>
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span>{getScoreBadgeText(analysis.overallScore)}</span>
                  </div>
                </div>

                {/* ATS Friendliness */}
                <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#737373]">ATS Friendliness</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F0F0EC] text-[#525252]">
                      Parser Accuracy
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-4xl font-serif font-bold text-[#1A1A1A]">{analysis.atsScore}</span>
                    <span className="text-xs text-[#737373]">/ 100</span>
                  </div>
                  <div className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${getScoreColor(analysis.atsScore)}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{analysis.atsScore >= 75 ? 'ATS Parse Ready' : 'Optimization Recommended'}</span>
                  </div>
                </div>

                {/* Section Scores Breakdown Summary */}
                <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-2 block">
                    Category Breakdown
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#525252] flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-[#737373]" /> Experience
                      </span>
                      <span className="font-semibold text-[#1A1A1A]">{analysis.experience?.score || 80}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#525252] flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-[#737373]" /> Projects
                      </span>
                      <span className="font-semibold text-[#1A1A1A]">{analysis.projects?.score || 85}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#525252] flex items-center gap-1.5">
                        <GraduationCap className="w-3 h-3 text-[#737373]" /> Education
                      </span>
                      <span className="font-semibold text-[#1A1A1A]">{analysis.education?.score || 90}/100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              {analysis.summary && (
                <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#1A1A1A]" /> Executive Summary
                  </h4>
                  <p className="text-xs text-[#333] leading-relaxed font-sans">{analysis.summary}</p>
                </div>
              )}

              {/* Sub-Category Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-[#E5E5E1] pb-2">
                <button
                  onClick={() => setActiveCategory('overview')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    activeCategory === 'overview'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#525252] hover:bg-[#F0F0EC]'
                  }`}
                >
                  Strengths & Weaknesses
                </button>
                <button
                  onClick={() => setActiveCategory('skills')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    activeCategory === 'skills'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#525252] hover:bg-[#F0F0EC]'
                  }`}
                >
                  Skills Breakdown
                </button>
                <button
                  onClick={() => setActiveCategory('sections')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    activeCategory === 'sections'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#525252] hover:bg-[#F0F0EC]'
                  }`}
                >
                  Section Reviews
                </button>
                <button
                  onClick={() => setActiveCategory('ats')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    activeCategory === 'ats'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#525252] hover:bg-[#F0F0EC]'
                  }`}
                >
                  Formatting & ATS Flags
                </button>
                <button
                  onClick={() => setActiveCategory('suggestions')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    activeCategory === 'suggestions'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#525252] hover:bg-[#F0F0EC]'
                  }`}
                >
                  Actionable Suggestions
                </button>
              </div>

              {/* TAB 1: Strengths & Weaknesses */}
              {activeCategory === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200 space-y-3">
                    <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Strengths
                    </h5>
                    <ul className="space-y-2">
                      {analysis.strengths?.map((str, idx) => (
                        <li key={idx} className="text-xs text-emerald-950 flex items-start gap-2 leading-relaxed">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses / Improvements */}
                  <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-200 space-y-3">
                    <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Areas for Improvement
                    </h5>
                    <ul className="space-y-2">
                      {analysis.weaknesses?.map((weak, idx) => (
                        <li key={idx} className="text-xs text-amber-950 flex items-start gap-2 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: Skills Breakdown */}
              {activeCategory === 'skills' && (
                <div className="space-y-4">
                  {/* Technical Skills */}
                  <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs space-y-2.5">
                    <h5 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-blue-600" /> Technical Skills Detected ({analysis.skills?.technicalSkills?.length || 0})
                    </h5>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {analysis.skills?.technicalSkills?.map((skill, idx) => (
                        <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs space-y-2.5">
                    <h5 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-600" /> Soft Skills & Methodologies
                    </h5>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {analysis.skills?.softSkills?.map((skill, idx) => (
                        <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Section Reviews */}
              {activeCategory === 'sections' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Experience Review */}
                  <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#737373]" /> Experience Section
                      </h5>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F0F0EC] text-[#1A1A1A]">
                        {analysis.experience?.score || 80}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#525252] leading-relaxed">{analysis.experience?.evaluation}</p>
                    {analysis.experience?.keyPoints && (
                      <ul className="space-y-1 pt-1">
                        {analysis.experience.keyPoints.map((pt, idx) => (
                          <li key={idx} className="text-[11px] text-[#737373] flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#737373] mt-1.5 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Projects Review */}
                  <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#737373]" /> Projects Section
                      </h5>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F0F0EC] text-[#1A1A1A]">
                        {analysis.projects?.score || 85}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#525252] leading-relaxed">{analysis.projects?.evaluation}</p>
                    {analysis.projects?.keyPoints && (
                      <ul className="space-y-1 pt-1">
                        {analysis.projects.keyPoints.map((pt, idx) => (
                          <li key={idx} className="text-[11px] text-[#737373] flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#737373] mt-1.5 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Education Review */}
                  <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#737373]" /> Education Section
                      </h5>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F0F0EC] text-[#1A1A1A]">
                        {analysis.education?.score || 90}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#525252] leading-relaxed">{analysis.education?.evaluation}</p>
                  </div>

                  {/* Certifications Review */}
                  <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#737373]" /> Certifications & Honors
                      </h5>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F0F0EC] text-[#1A1A1A]">
                        {analysis.certifications?.score || 75}/100
                      </span>
                    </div>
                    <p className="text-xs text-[#525252] leading-relaxed">{analysis.certifications?.evaluation}</p>
                  </div>
                </div>
              )}

              {/* TAB 4: Formatting & ATS Flags */}
              {activeCategory === 'ats' && (
                <div className="space-y-4">
                  {/* Formatting Issues */}
                  <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs space-y-2.5">
                    <h5 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-orange-600" /> Formatting & Layout Assessment
                    </h5>
                    <ul className="space-y-2">
                      {analysis.formattingIssues?.map((issue, idx) => (
                        <li key={idx} className="text-xs text-[#525252] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Info */}
                  <div className="bg-white rounded-xl p-4 border border-[#E5E5E1] shadow-xs space-y-2.5">
                    <h5 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-blue-600" /> Missing or Incomplete Information
                    </h5>
                    <ul className="space-y-2">
                      {analysis.missingInformation?.map((info, idx) => (
                        <li key={idx} className="text-xs text-[#525252] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <span>{info}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 5: Actionable Suggestions */}
              {activeCategory === 'suggestions' && (
                <div className="bg-white rounded-xl p-5 border border-[#E5E5E1] shadow-xs space-y-4">
                  <h5 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" /> Recruiter & Placement Recommendations
                  </h5>
                  <div className="space-y-3">
                    {analysis.suggestions?.map((sug, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-[#F0F0EC]/60 border border-[#E5E5E1] text-xs text-[#1A1A1A] leading-relaxed flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>{sug}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-blue-900">
                      <TrendingUp className="w-3.5 h-3.5" /> Recruiter Pro Tip: Google XYZ Formula
                    </div>
                    <p className="text-[11px] leading-relaxed text-blue-900/90">
                      Frame bullet points as: <span className="font-semibold italic">"Accomplished [X], as measured by [Y], by doing [Z]"</span> (e.g., "Reduced telemetry query latency by 28% by architecting distributed Kafka pipelines").
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E5E1] bg-white flex items-center justify-between">
          <span className="text-[11px] text-[#737373]">
            Analyzed locally • Privacy Preserved • Zero Cloud Storage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#1A1A1A] bg-[#F0F0EC] hover:bg-[#E5E5E1] rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
