import React, { useState, useEffect } from 'react';
import { 
  X, 
  User as UserIcon, 
  Code2, 
  Briefcase, 
  Award, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  GraduationCap, 
  Linkedin, 
  Github, 
  AlertCircle,
  Sparkles,
  Building2
} from 'lucide-react';
import { User, CodingProfiles, InternshipExperience, StudentCertification } from '../types';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'coding' | 'internships' | 'certifications' | 'academic' | 'bio'>('coding');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [cgpa, setCgpa] = useState<number | ''>('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [skillsString, setSkillsString] = useState('');

  // Coding Handles
  const [codingProfiles, setCodingProfiles] = useState<CodingProfiles>({
    leetcode: '',
    linkedin: '',
    codechef: '',
    hackerrank: '',
    codeforces: '',
    github: '',
    portfolio: '',
  });

  // Internships & Certifications
  const [internships, setInternships] = useState<InternshipExperience[]>([]);
  const [certifications, setCertifications] = useState<StudentCertification[]>([]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setStudentId(user.studentId || '');
      setCollege(user.college || '');
      setBranch(user.branch || '');
      setGraduationYear(user.graduationYear || '');
      setCgpa(user.cgpa !== undefined ? user.cgpa : '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setResumeUrl(user.resumeUrl || '');
      setSkillsString(user.skills ? user.skills.join(', ') : '');

      setCodingProfiles({
        leetcode: user.codingProfiles?.leetcode || '',
        linkedin: user.codingProfiles?.linkedin || '',
        codechef: user.codingProfiles?.codechef || '',
        hackerrank: user.codingProfiles?.hackerrank || '',
        codeforces: user.codingProfiles?.codeforces || '',
        github: user.codingProfiles?.github || '',
        portfolio: user.codingProfiles?.portfolio || '',
      });

      setInternships(user.internships || []);
      setCertifications(user.certifications || []);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Internship Handlers
  const handleAddInternship = () => {
    setInternships([
      ...internships,
      {
        id: `int_${Date.now()}`,
        companyName: '',
        role: '',
        duration: '',
        location: '',
        keyLearnings: '',
        certificateUrl: '',
      }
    ]);
  };

  const handleUpdateInternship = (index: number, field: keyof InternshipExperience, value: string) => {
    const updated = [...internships];
    updated[index] = { ...updated[index], [field]: value };
    setInternships(updated);
  };

  const handleRemoveInternship = (index: number) => {
    setInternships(internships.filter((_, i) => i !== index));
  };

  // Certification Handlers
  const handleAddCertification = (suggestedIssuer?: string) => {
    setCertifications([
      ...certifications,
      {
        id: `cert_${Date.now()}`,
        title: '',
        issuer: suggestedIssuer || '',
        issueDate: '',
        credentialId: '',
        credentialUrl: '',
      }
    ]);
  };

  const handleUpdateCertification = (index: number, field: keyof StudentCertification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const skillsArray = skillsString
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      await updateProfile({
        name: name.trim(),
        studentId: studentId.trim(),
        college: college.trim(),
        branch: branch.trim(),
        graduationYear: graduationYear.trim(),
        cgpa: cgpa === '' ? undefined : Number(cgpa),
        phone: phone.trim(),
        bio: bio.trim(),
        resumeUrl: resumeUrl.trim(),
        skills: skillsArray,
        codingProfiles,
        internships,
        certifications,
      });

      setSuccessMessage('Student Profile updated!');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E5E5E1] shadow-xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E1] flex items-center justify-between bg-[#FCFCFA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-[#FCFCFA] flex items-center justify-center font-serif text-lg font-bold">
              {name ? name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">Candidate Profile & Handles</h2>
              <p className="text-[11px] text-[#737373]">Manage LeetCode, LinkedIn, Internships & Certifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#1A1A1A] hover:bg-[#F0F0EC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 p-2 bg-[#F0F0EC] border-b border-[#E5E5E1] shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('coding')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'coding' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Coding Handles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('internships')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'internships' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Internships ({internships.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certifications')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'certifications' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Certifications ({certifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'academic' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'bio' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#525252] hover:text-[#1A1A1A]'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Bio & Contact</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: CODING HANDLES */}
          {activeTab === 'coding' && (
            <div className="space-y-4">
              <p className="text-xs text-[#737373]">Enter your developer handles or full profile URLs to link them to your recruiter ledger:</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    LeetCode Profile URL / Username
                  </label>
                  <input
                    type="text"
                    value={codingProfiles.leetcode}
                    onChange={(e) => setCodingProfiles({ ...codingProfiles, leetcode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                    placeholder="https://leetcode.com/u/your_username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                    LinkedIn Profile URL / Username
                  </label>
                  <input
                    type="text"
                    value={codingProfiles.linkedin}
                    onChange={(e) => setCodingProfiles({ ...codingProfiles, linkedin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                    placeholder="https://linkedin.com/in/your_name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-800" />
                    CodeChef Username / URL
                  </label>
                  <input
                    type="text"
                    value={codingProfiles.codechef}
                    onChange={(e) => setCodingProfiles({ ...codingProfiles, codechef: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                    placeholder="e.g. username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    HackerRank Username / URL
                  </label>
                  <input
                    type="text"
                    value={codingProfiles.hackerrank}
                    onChange={(e) => setCodingProfiles({ ...codingProfiles, hackerrank: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                    placeholder="e.g. username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Codeforces Handle / URL
                  </label>
                  <input
                    type="text"
                    value={codingProfiles.codeforces}
                    onChange={(e) => setCodingProfiles({ ...codingProfiles, codeforces: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                    placeholder="e.g. username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-[#1A1A1A]" />
                    GitHub Profile URL
                  </label>
                  <input
                    type="text"
                    value={codingProfiles.github}
                    onChange={(e) => setCodingProfiles({ ...codingProfiles, github: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                    placeholder="https://github.com/your_github"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERNSHIPS */}
          {activeTab === 'internships' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#737373]">Log past internships and technical traineeships:</p>
                <button
                  type="button"
                  onClick={handleAddInternship}
                  className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-[#FCFCFA] text-xs font-semibold hover:bg-[#2C2C2C] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Internship</span>
                </button>
              </div>

              {internships.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#FCFCFA] border border-dashed border-[#E5E5E1] text-center">
                  <Briefcase className="w-6 h-6 text-[#A3A3A3] mx-auto mb-1" />
                  <p className="text-xs font-semibold text-[#1A1A1A]">No internships added yet</p>
                  <p className="text-[11px] text-[#737373]">Click above to add previous companies and certificates.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {internships.map((internship, index) => (
                    <div key={internship.id || index} className="p-4 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-2">
                        <span className="text-xs font-bold text-[#1A1A1A]">Internship #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInternship(index)}
                          className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#525252] mb-1">Company</label>
                          <input
                            type="text"
                            value={internship.companyName}
                            onChange={(e) => handleUpdateInternship(index, 'companyName', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                            placeholder="e.g. Cisco, Infosys"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#525252] mb-1">Role / Designation</label>
                          <input
                            type="text"
                            value={internship.role}
                            onChange={(e) => handleUpdateInternship(index, 'role', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                            placeholder="e.g. SDE Intern"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#525252] mb-1">Duration</label>
                          <input
                            type="text"
                            value={internship.duration}
                            onChange={(e) => handleUpdateInternship(index, 'duration', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                            placeholder="May 2024 - Jul 2024"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#525252] mb-1">Certificate Link</label>
                          <input
                            type="url"
                            value={internship.certificateUrl || ''}
                            onChange={(e) => handleUpdateInternship(index, 'certificateUrl', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                            placeholder="https://drive.google.com/..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#525252] mb-1">Key Responsibilities & Learnings</label>
                        <textarea
                          rows={2}
                          value={internship.keyLearnings || ''}
                          onChange={(e) => handleUpdateInternship(index, 'keyLearnings', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                          placeholder="Engineered APIs, optimized SQL queries..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CERTIFICATIONS */}
          {activeTab === 'certifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-[#737373]">Add certifications & verified skill badges:</p>
                <button
                  type="button"
                  onClick={() => handleAddCertification()}
                  className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-[#FCFCFA] text-xs font-semibold hover:bg-[#2C2C2C] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Certificate</span>
                </button>
              </div>

              {/* Quick Issuer Buttons */}
              <div className="p-2.5 bg-[#F0F0EC] rounded-xl border border-[#E5E5E1] flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#525252] flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Quick:
                </span>
                {['Infosys Springboard', 'IBM SkillsBuild', 'AWS Cloud', 'Coursera', 'NPTEL'].map((issuer) => (
                  <button
                    key={issuer}
                    type="button"
                    onClick={() => handleAddCertification(issuer)}
                    className="px-2 py-0.5 rounded bg-white border border-[#E5E5E1] text-[10px] font-medium text-[#1A1A1A] hover:bg-[#E5E5E1]"
                  >
                    + {issuer}
                  </button>
                ))}
              </div>

              {certifications.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#FCFCFA] border border-dashed border-[#E5E5E1] text-center">
                  <Award className="w-6 h-6 text-[#A3A3A3] mx-auto mb-1" />
                  <p className="text-xs font-semibold text-[#1A1A1A]">No certifications listed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certifications.map((cert, index) => (
                    <div key={cert.id || index} className="p-4 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-2">
                        <span className="text-xs font-bold text-[#1A1A1A]">Certificate #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCertification(index)}
                          className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#525252] mb-1">Title</label>
                          <input
                            type="text"
                            value={cert.title}
                            onChange={(e) => handleUpdateCertification(index, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none font-medium"
                            placeholder="e.g. AI & Cloud Architecture"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#525252] mb-1">Issuer</label>
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={(e) => handleUpdateCertification(index, 'issuer', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                            placeholder="Infosys Springboard"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#525252] mb-1">Issue Date</label>
                          <input
                            type="text"
                            value={cert.issueDate || ''}
                            onChange={(e) => handleUpdateCertification(index, 'issueDate', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                            placeholder="Aug 2024"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#525252] mb-1">Credential URL</label>
                          <input
                            type="url"
                            value={cert.credentialUrl || ''}
                            onChange={(e) => handleUpdateCertification(index, 'credentialUrl', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACADEMIC */}
          {activeTab === 'academic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">College / University</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Branch / Degree</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Graduation Year</label>
                <input
                  type="text"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Cumulative CGPA (out of 10.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 5: BIO & CONTACT */}
          {activeTab === 'bio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Student Roll Number</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Online Resume Link</label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Bio / Profile Summary</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Technical Skills (comma-separated)</label>
                <input
                  type="text"
                  value={skillsString}
                  onChange={(e) => setSkillsString(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FCFCFA] border border-[#E5E5E1] text-xs focus:ring-1 focus:ring-[#1A1A1A] focus:outline-none"
                  placeholder="Java, Python, React, Node.js, SQL"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5E5E1] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E5E1] text-xs font-semibold text-[#525252] hover:bg-[#F0F0EC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1A1A1A] text-[#FCFCFA] text-xs font-semibold hover:bg-[#2C2C2C] transition-all shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
