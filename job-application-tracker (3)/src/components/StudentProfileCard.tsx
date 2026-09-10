import React from 'react';
import { 
  User as UserIcon, 
  Code2, 
  Briefcase, 
  Award, 
  ExternalLink, 
  Edit3, 
  GraduationCap, 
  FileText, 
  Linkedin, 
  Github, 
  Globe, 
  Sparkles,
  Building2,
  CheckCircle2,
  Phone,
  Mail
} from 'lucide-react';
import { User } from '../types';

interface StudentProfileCardProps {
  user: User | null;
  onEditProfile: () => void;
}

export const StudentProfileCard: React.FC<StudentProfileCardProps> = ({ user, onEditProfile }) => {
  if (!user) return null;

  const cp = user.codingProfiles || {};
  const internships = user.internships || [];
  const certs = user.certifications || [];

  const hasAnyCodingProfile = !!(cp.leetcode || cp.linkedin || cp.codechef || cp.hackerrank || cp.codeforces || cp.github || cp.portfolio);

  const getProfileUrl = (platform: string, handle?: string) => {
    if (!handle) return '';
    if (handle.startsWith('http://') || handle.startsWith('https://')) return handle;
    switch (platform) {
      case 'leetcode': return `https://leetcode.com/u/${handle}`;
      case 'linkedin': return `https://linkedin.com/in/${handle}`;
      case 'codechef': return `https://www.codechef.com/users/${handle}`;
      case 'hackerrank': return `https://www.hackerrank.com/${handle}`;
      case 'codeforces': return `https://codeforces.com/profile/${handle}`;
      case 'github': return `https://github.com/${handle}`;
      default: return `https://${handle}`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E1] p-6 shadow-xs space-y-6">
      
      {/* Top Banner: Student Info & Quick Edit */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[#E5E5E1]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] text-[#FCFCFA] flex items-center justify-center font-serif text-2xl font-bold shadow-xs shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-serif text-xl font-bold text-[#1A1A1A] tracking-tight">{user.name || 'Student Candidate'}</h2>
              {user.studentId && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F0F0EC] text-[#525252] border border-[#E5E5E1] font-medium">
                  ID: {user.studentId}
                </span>
              )}
              {user.cgpa && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  CGPA: {user.cgpa.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-xs text-[#737373] mt-1 flex items-center gap-1.5 flex-wrap">
              <GraduationCap className="w-3.5 h-3.5 text-[#A3A3A3]" />
              <span>{user.branch || 'Department'}</span>
              <span>•</span>
              <span>{user.college || 'University Campus'}</span>
              <span>•</span>
              <span className="font-mono">Class of {user.graduationYear || '2026'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-end">
          {user.resumeUrl && (
            <a
              href={user.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0F0EC] text-[#1A1A1A] text-xs font-semibold hover:bg-[#E5E5E1] transition-colors border border-[#E5E5E1]"
            >
              <FileText className="w-3.5 h-3.5 text-[#525252]" />
              <span>View Resume</span>
              <ExternalLink className="w-3 h-3 text-[#737373]" />
            </a>
          )}
          <button
            id="btn-edit-student-profile"
            onClick={onEditProfile}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A1A1A] text-[#FCFCFA] text-xs font-semibold hover:bg-[#2C2C2C] transition-all shadow-xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile & Handles</span>
          </button>
        </div>
      </div>

      {/* Bio & Skill Tags */}
      {(user.bio || (user.skills && user.skills.length > 0)) && (
        <div className="space-y-3">
          {user.bio && (
            <p className="text-xs text-[#525252] leading-relaxed italic bg-[#FCFCFA] p-3 rounded-xl border border-[#F0F0EC]">
              "{user.bio}"
            </p>
          )}
          {user.skills && user.skills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-[#737373] mr-1">Skills:</span>
              {user.skills.map((skill, idx) => (
                <span key={idx} className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[#F0F0EC] text-[#1A1A1A] border border-[#E5E5E1]">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Competitive Coding & Developer Handles */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#1A1A1A]" />
            Competitive Coding & Developer Handles
          </span>
          {!hasAnyCodingProfile && (
            <button onClick={onEditProfile} className="text-[11px] text-indigo-600 font-semibold hover:underline">
              + Add handles
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* LeetCode */}
          <a
            href={cp.leetcode ? getProfileUrl('leetcode', cp.leetcode) : '#'}
            target={cp.leetcode ? "_blank" : undefined}
            rel="noreferrer"
            onClick={(e) => { if (!cp.leetcode) { e.preventDefault(); onEditProfile(); } }}
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              cp.leetcode 
                ? 'bg-[#FCFCFA] border-amber-200 hover:border-amber-400 hover:shadow-xs cursor-pointer' 
                : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1] opacity-75 hover:opacity-100 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                LeetCode
              </span>
              {cp.leetcode ? <ExternalLink className="w-3 h-3 text-amber-600" /> : <span className="text-[10px] text-[#A3A3A3]">+</span>}
            </div>
            <span className="text-[10px] font-mono text-[#737373] truncate">
              {cp.leetcode ? (cp.leetcode.includes('/') ? cp.leetcode.split('/').filter(Boolean).pop() : cp.leetcode) : 'Not linked'}
            </span>
          </a>

          {/* LinkedIn */}
          <a
            href={cp.linkedin ? getProfileUrl('linkedin', cp.linkedin) : '#'}
            target={cp.linkedin ? "_blank" : undefined}
            rel="noreferrer"
            onClick={(e) => { if (!cp.linkedin) { e.preventDefault(); onEditProfile(); } }}
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              cp.linkedin 
                ? 'bg-[#FCFCFA] border-blue-200 hover:border-blue-400 hover:shadow-xs cursor-pointer' 
                : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1] opacity-75 hover:opacity-100 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Linkedin className="w-3 h-3 text-[#0A66C2]" />
                LinkedIn
              </span>
              {cp.linkedin ? <ExternalLink className="w-3 h-3 text-blue-600" /> : <span className="text-[10px] text-[#A3A3A3]">+</span>}
            </div>
            <span className="text-[10px] font-mono text-[#737373] truncate">
              {cp.linkedin ? (cp.linkedin.includes('/') ? cp.linkedin.split('/').filter(Boolean).pop() : cp.linkedin) : 'Not linked'}
            </span>
          </a>

          {/* CodeChef */}
          <a
            href={cp.codechef ? getProfileUrl('codechef', cp.codechef) : '#'}
            target={cp.codechef ? "_blank" : undefined}
            rel="noreferrer"
            onClick={(e) => { if (!cp.codechef) { e.preventDefault(); onEditProfile(); } }}
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              cp.codechef 
                ? 'bg-[#FCFCFA] border-amber-300 hover:border-amber-500 hover:shadow-xs cursor-pointer' 
                : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1] opacity-75 hover:opacity-100 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-800" />
                CodeChef
              </span>
              {cp.codechef ? <ExternalLink className="w-3 h-3 text-amber-700" /> : <span className="text-[10px] text-[#A3A3A3]">+</span>}
            </div>
            <span className="text-[10px] font-mono text-[#737373] truncate">
              {cp.codechef ? (cp.codechef.includes('/') ? cp.codechef.split('/').filter(Boolean).pop() : cp.codechef) : 'Not linked'}
            </span>
          </a>

          {/* HackerRank */}
          <a
            href={cp.hackerrank ? getProfileUrl('hackerrank', cp.hackerrank) : '#'}
            target={cp.hackerrank ? "_blank" : undefined}
            rel="noreferrer"
            onClick={(e) => { if (!cp.hackerrank) { e.preventDefault(); onEditProfile(); } }}
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              cp.hackerrank 
                ? 'bg-[#FCFCFA] border-emerald-200 hover:border-emerald-400 hover:shadow-xs cursor-pointer' 
                : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1] opacity-75 hover:opacity-100 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                HackerRank
              </span>
              {cp.hackerrank ? <ExternalLink className="w-3 h-3 text-emerald-600" /> : <span className="text-[10px] text-[#A3A3A3]">+</span>}
            </div>
            <span className="text-[10px] font-mono text-[#737373] truncate">
              {cp.hackerrank ? (cp.hackerrank.includes('/') ? cp.hackerrank.split('/').filter(Boolean).pop() : cp.hackerrank) : 'Not linked'}
            </span>
          </a>

          {/* Codeforces */}
          <a
            href={cp.codeforces ? getProfileUrl('codeforces', cp.codeforces) : '#'}
            target={cp.codeforces ? "_blank" : undefined}
            rel="noreferrer"
            onClick={(e) => { if (!cp.codeforces) { e.preventDefault(); onEditProfile(); } }}
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              cp.codeforces 
                ? 'bg-[#FCFCFA] border-rose-200 hover:border-rose-400 hover:shadow-xs cursor-pointer' 
                : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1] opacity-75 hover:opacity-100 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Codeforces
              </span>
              {cp.codeforces ? <ExternalLink className="w-3 h-3 text-rose-600" /> : <span className="text-[10px] text-[#A3A3A3]">+</span>}
            </div>
            <span className="text-[10px] font-mono text-[#737373] truncate">
              {cp.codeforces ? (cp.codeforces.includes('/') ? cp.codeforces.split('/').filter(Boolean).pop() : cp.codeforces) : 'Not linked'}
            </span>
          </a>

          {/* GitHub */}
          <a
            href={cp.github ? getProfileUrl('github', cp.github) : '#'}
            target={cp.github ? "_blank" : undefined}
            rel="noreferrer"
            onClick={(e) => { if (!cp.github) { e.preventDefault(); onEditProfile(); } }}
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              cp.github 
                ? 'bg-[#FCFCFA] border-neutral-300 hover:border-neutral-500 hover:shadow-xs cursor-pointer' 
                : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1] opacity-75 hover:opacity-100 cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Github className="w-3 h-3 text-[#1A1A1A]" />
                GitHub
              </span>
              {cp.github ? <ExternalLink className="w-3 h-3 text-neutral-800" /> : <span className="text-[10px] text-[#A3A3A3]">+</span>}
            </div>
            <span className="text-[10px] font-mono text-[#737373] truncate">
              {cp.github ? (cp.github.includes('/') ? cp.github.split('/').filter(Boolean).pop() : cp.github) : 'Not linked'}
            </span>
          </a>
        </div>
      </div>

      {/* Grid for Previous Internships & Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-[#E5E5E1]">
        
        {/* Previous Internships List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#1A1A1A]" />
              Previous Internships ({internships.length})
            </span>
            <button onClick={onEditProfile} className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer">
              + Add Internship
            </button>
          </div>

          {internships.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#FCFCFA] border border-dashed border-[#E5E5E1] text-center">
              <p className="text-[11px] text-[#737373]">No previous internship logged yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {internships.map((intExp, idx) => (
                <div key={intExp.id || idx} className="p-3.5 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[#1A1A1A]">{intExp.companyName || 'Company'}</h4>
                      <p className="text-[11px] font-medium text-[#525252]">{intExp.role || 'Intern'}</p>
                    </div>
                    {intExp.duration && (
                      <span className="text-[10px] font-mono text-[#737373] bg-[#F0F0EC] px-2 py-0.5 rounded border border-[#E5E5E1]">
                        {intExp.duration}
                      </span>
                    )}
                  </div>
                  {intExp.keyLearnings && (
                    <p className="text-[11px] text-[#525252] line-clamp-2 leading-relaxed">
                      {intExp.keyLearnings}
                    </p>
                  )}
                  {intExp.certificateUrl && (
                    <div className="pt-1">
                      <a
                        href={intExp.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:underline"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Internship Certificate</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications & Badges List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              Verified Certifications ({certs.length})
            </span>
            <button onClick={onEditProfile} className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer">
              + Add Certificate
            </button>
          </div>

          {certs.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#FCFCFA] border border-dashed border-[#E5E5E1] text-center">
              <p className="text-[11px] text-[#737373]">No certifications listed (Infosys Springboard, IBM, AWS, etc.).</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {certs.map((cert, idx) => (
                <div key={cert.id || idx} className="p-3.5 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <h4 className="text-xs font-bold text-[#1A1A1A]">{cert.title || 'Course Certificate'}</h4>
                    </div>
                    <p className="text-[11px] text-[#737373] pl-5">
                      {cert.issuer || 'Issuing Authority'} {cert.issueDate ? `• ${cert.issueDate}` : ''}
                    </p>
                  </div>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E5E1] text-[11px] font-medium text-indigo-600 hover:bg-[#F0F0EC] transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span>Verify</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
