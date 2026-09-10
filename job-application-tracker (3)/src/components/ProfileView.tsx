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
  Mail,
  BookOpen,
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileViewProps {
  onOpenEditModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenEditModal }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E1] p-12 text-center space-y-4">
        <UserIcon className="w-12 h-12 text-[#A3A3A3] mx-auto" />
        <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">No Student Profile Active</h3>
        <p className="text-xs text-[#737373]">Please sign in or register to view and customize your placement profile.</p>
      </div>
    );
  }

  const cp = user.codingProfiles || {};
  const internships = user.internships || [];
  const certs = user.certifications || [];

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
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#1A1A1A] rounded-2xl p-6 sm:p-8 text-[#FCFCFA] shadow-sm border border-[#2C2C2C] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white text-[#1A1A1A] flex items-center justify-center font-serif text-3xl sm:text-4xl font-bold shadow-md shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#2C2C2C] text-[#D4D4D0] text-[10px] font-semibold uppercase tracking-widest border border-[#3E3E3E]">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Verified Placement Dossier</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#FCFCFA]">
              {user.name || 'Student Candidate'}
            </h1>
            <p className="text-xs sm:text-sm text-[#A3A39E] flex items-center gap-2 flex-wrap">
              <span>{user.email}</span>
              {user.studentId && <span>• ID: <span className="font-mono">{user.studentId}</span></span>}
              {user.phone && <span>• {user.phone}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
          {user.resumeUrl && (
            <a
              href={user.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2C2C2C] text-[#FCFCFA] text-xs font-semibold hover:bg-[#383838] transition-colors border border-[#3E3E3E]"
            >
              <FileText className="w-4 h-4 text-[#D4D4D0]" />
              <span>Resume PDF</span>
              <ExternalLink className="w-3 h-3 text-[#A3A39E]" />
            </a>
          )}
          <button
            onClick={onOpenEditModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1A1A1A] text-xs font-bold hover:bg-[#F0F0EC] transition-all shadow-sm cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-[#1A1A1A]" />
            <span>Edit Profile & Handles</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Academic & Bio on Left, Competitive Handles on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Academic & Summary */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Academic Information Card */}
          <div className="bg-white rounded-2xl border border-[#E5E5E1] p-5 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A] flex items-center gap-2 pb-3 border-b border-[#E5E5E1]">
              <GraduationCap className="w-4 h-4 text-[#1A1A1A]" />
              Academic Credentials
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-[#737373] block uppercase tracking-wider">Institution</span>
                <span className="font-medium text-[#1A1A1A]">{user.college || 'Engineering Institute'}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#737373] block uppercase tracking-wider">Discipline / Branch</span>
                <span className="font-medium text-[#1A1A1A]">{user.branch || 'Computer Science & Engineering'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-[#737373] block uppercase tracking-wider">Class Batch</span>
                  <span className="font-medium text-[#1A1A1A] font-mono">{user.graduationYear || '2026'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#737373] block uppercase tracking-wider">CGPA</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {user.cgpa !== undefined ? `${user.cgpa.toFixed(2)} / 10.0` : 'Not recorded'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Skills & Bio */}
          <div className="bg-white rounded-2xl border border-[#E5E5E1] p-5 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A] flex items-center gap-2 pb-3 border-b border-[#E5E5E1]">
              <Layers className="w-4 h-4 text-[#1A1A1A]" />
              Skill Matrix & Bio
            </h3>

            {user.bio && (
              <div>
                <span className="text-[11px] font-semibold text-[#737373] block uppercase tracking-wider mb-1">Executive Summary</span>
                <p className="text-xs text-[#525252] leading-relaxed italic bg-[#FCFCFA] p-3 rounded-xl border border-[#F0F0EC]">
                  "{user.bio}"
                </p>
              </div>
            )}

            <div>
              <span className="text-[11px] font-semibold text-[#737373] block uppercase tracking-wider mb-2">Technical Core</span>
              {user.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((skill, idx) => (
                    <span key={idx} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#F0F0EC] text-[#1A1A1A] border border-[#E5E5E1] font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#737373] italic">No skills listed yet.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (2 Spans): Coding Profiles, Internships & Certifications */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Coding & Developer Handles Card */}
          <div className="bg-white rounded-2xl border border-[#E5E5E1] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#1A1A1A]" />
                Coding Profiles & Online Handles
              </h3>
              <button
                onClick={onOpenEditModal}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Update Handles</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {/* LeetCode */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                cp.leetcode ? 'bg-[#FCFCFA] border-amber-200 shadow-xs' : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    LeetCode
                  </span>
                  {cp.leetcode && (
                    <a href={getProfileUrl('leetcode', cp.leetcode)} target="_blank" rel="noreferrer" className="text-amber-600 hover:text-amber-800">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-xs font-mono text-[#525252] truncate">
                  {cp.leetcode || <span className="text-[#A3A3A3] italic">Not configured</span>}
                </div>
              </div>

              {/* LinkedIn */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                cp.linkedin ? 'bg-[#FCFCFA] border-blue-200 shadow-xs' : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                    <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                    LinkedIn
                  </span>
                  {cp.linkedin && (
                    <a href={getProfileUrl('linkedin', cp.linkedin)} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-xs font-mono text-[#525252] truncate">
                  {cp.linkedin || <span className="text-[#A3A3A3] italic">Not configured</span>}
                </div>
              </div>

              {/* CodeChef */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                cp.codechef ? 'bg-[#FCFCFA] border-amber-300 shadow-xs' : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-800" />
                    CodeChef
                  </span>
                  {cp.codechef && (
                    <a href={getProfileUrl('codechef', cp.codechef)} target="_blank" rel="noreferrer" className="text-amber-700 hover:text-amber-900">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-xs font-mono text-[#525252] truncate">
                  {cp.codechef || <span className="text-[#A3A3A3] italic">Not configured</span>}
                </div>
              </div>

              {/* HackerRank */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                cp.hackerrank ? 'bg-[#FCFCFA] border-emerald-200 shadow-xs' : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    HackerRank
                  </span>
                  {cp.hackerrank && (
                    <a href={getProfileUrl('hackerrank', cp.hackerrank)} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-800">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-xs font-mono text-[#525252] truncate">
                  {cp.hackerrank || <span className="text-[#A3A3A3] italic">Not configured</span>}
                </div>
              </div>

              {/* Codeforces */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                cp.codeforces ? 'bg-[#FCFCFA] border-rose-200 shadow-xs' : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Codeforces
                  </span>
                  {cp.codeforces && (
                    <a href={getProfileUrl('codeforces', cp.codeforces)} target="_blank" rel="noreferrer" className="text-rose-600 hover:text-rose-800">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-xs font-mono text-[#525252] truncate">
                  {cp.codeforces || <span className="text-[#A3A3A3] italic">Not configured</span>}
                </div>
              </div>

              {/* GitHub */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                cp.github ? 'bg-[#FCFCFA] border-neutral-300 shadow-xs' : 'bg-[#F9F9F8] border-dashed border-[#E5E5E1]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
                    <Github className="w-3.5 h-3.5 text-[#1A1A1A]" />
                    GitHub
                  </span>
                  {cp.github && (
                    <a href={getProfileUrl('github', cp.github)} target="_blank" rel="noreferrer" className="text-neutral-800 hover:text-black">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-xs font-mono text-[#525252] truncate">
                  {cp.github || <span className="text-[#A3A3A3] italic">Not configured</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Previous Internships Showcase */}
          <div className="bg-white rounded-2xl border border-[#E5E5E1] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#1A1A1A]" />
                Previous Internships ({internships.length})
              </h3>
              <button
                onClick={onOpenEditModal}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Add Internship
              </button>
            </div>

            {internships.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#FCFCFA] border border-dashed border-[#E5E5E1] text-center">
                <p className="text-xs text-[#737373]">No previous internship records logged yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {internships.map((item, idx) => (
                  <div key={item.id || idx} className="p-4 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#1A1A1A]">{item.companyName}</h4>
                        <p className="text-xs font-medium text-[#525252]">{item.role}</p>
                      </div>
                      {item.duration && (
                        <span className="text-[10px] font-mono text-[#737373] bg-[#F0F0EC] px-2 py-0.5 rounded border border-[#E5E5E1]">
                          {item.duration}
                        </span>
                      )}
                    </div>
                    {item.keyLearnings && (
                      <p className="text-xs text-[#525252] leading-relaxed">
                        {item.keyLearnings}
                      </p>
                    )}
                    {item.certificateUrl && (
                      <a
                        href={item.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline pt-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Certificate</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications Showcase */}
          <div className="bg-white rounded-2xl border border-[#E5E5E1] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Certifications & Badges (Infosys Springboard, IBM, AWS)
              </h3>
              <button
                onClick={onOpenEditModal}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Add Certificate
              </button>
            </div>

            {certs.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#FCFCFA] border border-dashed border-[#E5E5E1] text-center">
                <p className="text-xs text-[#737373]">No certificates added yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certs.map((cert, idx) => (
                  <div key={cert.id || idx} className="p-4 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <h4 className="text-xs font-bold text-[#1A1A1A]">{cert.title}</h4>
                      </div>
                      <p className="text-[11px] text-[#737373] pl-5.5">
                        {cert.issuer} {cert.issueDate ? `• ${cert.issueDate}` : ''}
                      </p>
                    </div>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E1] text-xs font-medium text-indigo-600 hover:bg-[#F0F0EC] transition-colors flex items-center gap-1 shrink-0"
                      >
                        <span>Verify</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
