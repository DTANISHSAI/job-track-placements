import React from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  Mail, 
  FileText, 
  UserCheck, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Database,
  EyeOff,
  Trash2,
  HelpCircle,
  Globe
} from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBackToApp: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBackToApp }) => {
  return (
    <div className="min-h-screen bg-[#FCFCFA] text-[#1A1A1A] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#FCFCFA]/95 backdrop-blur-md border-b border-[#E5E5E1]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tracker</span>
            </button>
            <div className="h-4 w-px bg-zinc-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-[#1A1A1A] text-lg tracking-tight">JobTrack</span>
              <span className="text-[10px] uppercase font-semibold tracking-widest px-1.5 py-0.5 rounded bg-[#F0F0EC] text-[#525252] border border-[#E5E5E1]">Legal</span>
            </div>
          </div>

          <div className="text-xs text-zinc-500 font-medium">
            Effective Date: March 2026
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Title & Introduction */}
        <div className="space-y-4 border-b border-[#E5E5E1] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Privacy Policy & Google API User Data Disclosure</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight">
            JobTrack Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-3xl">
            This Privacy Policy describes how <strong>JobTrack</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the Application&quot;), a personal campus placement portal and job application tracker, collects, uses, protects, and discloses your personal data when you access or use our services.
          </p>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Open Access Notice:</strong> This Privacy Policy is publicly accessible without requiring registration, authentication, or account sign-in, and is hosted directly on our authorized application domain.
            </div>
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
            <FileText className="w-5 h-5 text-zinc-700" />
            1. Information We Collect
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            We only collect data strictly necessary to assist students and job seekers in tracking their recruitment drives, interview schedules, compensation details, and application statuses:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-white border border-[#E5E5E1] space-y-1.5">
              <div className="font-semibold text-xs text-[#1A1A1A] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Student Profile Information
              </div>
              <p className="text-[12px] text-zinc-600 leading-relaxed">
                Your full name, student email address, university/college affiliation, degree branch, graduation year, target CTC, and optional LeetCode handle.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E5E5E1] space-y-1.5">
              <div className="font-semibold text-xs text-[#1A1A1A] flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Job Application Records
              </div>
              <p className="text-[12px] text-zinc-600 leading-relaxed">
                Company names, applied job titles, recruitment stages, packages (LPA), job types, application links, referral contacts, and custom notes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E5E5E1] space-y-1.5">
              <div className="font-semibold text-xs text-[#1A1A1A] flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                Interview Timelines & Prep
              </div>
              <p className="text-[12px] text-zinc-600 leading-relaxed">
                Dates and times of technical or HR rounds, interview formats, meeting links, interviewers, and rounds completion logs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E5E5E1] space-y-1.5">
              <div className="font-semibold text-xs text-[#1A1A1A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                Resume & ATS Content
              </div>
              <p className="text-[12px] text-zinc-600 leading-relaxed">
                Resume files stored client-side in your browser storage (IndexedDB) for local ATS keyword parsing and score analysis.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Google User Data & Gmail Integration */}
        <section className="space-y-4 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-200">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-serif font-bold text-indigo-950">
              2. Google API Services & Gmail User Data Disclosure
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed">
            JobTrack offers an optional feature that allows users to connect their Google Account to detect recruitment and placement updates automatically from their inbox.
          </p>

          <div className="space-y-3 pt-2 text-xs sm:text-sm text-zinc-700">
            <div className="p-4 rounded-xl bg-white border border-indigo-100 space-y-2">
              <h3 className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                Scope Requested: <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-indigo-700">https://www.googleapis.com/auth/gmail.readonly</code>
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                We only request read-only access to search for recruitment updates, online assessment invitations, interview dates, and offer letters. JobTrack cannot send emails, compose messages, edit drafts, or delete any content in your inbox.
              </p>
            </div>

            {/* Google Limited Use Compliance Requirement */}
            <div className="p-4 rounded-xl bg-white border border-indigo-200 space-y-2.5">
              <h3 className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Google API Services User Data Policy Compliance
              </h3>
              <blockquote className="border-l-4 border-indigo-600 pl-3 py-1 text-xs sm:text-[13px] font-medium text-zinc-800 italic bg-indigo-50/40 rounded-r">
                &quot;JobTrack&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 underline font-semibold inline-flex items-center gap-0.5"
                >
                  Google API Services User Data Policy
                  <ExternalLink className="w-3 h-3" />
                </a>
                , including the Limited Use requirements.&quot;
              </blockquote>
              
              <ul className="space-y-2 pt-1 text-xs text-zinc-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>No Sale or Third-Party Transfer:</strong> We do not transfer, sell, or rent your Google user data or email contents to data brokers, advertisers, or third-party marketplaces.</span>
                </li>
                <li className="flex items-start gap-2">
                  <EyeOff className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>No Advertisements:</strong> Your Google user data is never used or transferred for serving advertisements, personalized promotions, or interest-based retargeting.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>No AI/ML Model Training:</strong> Google user data and email messages are never used to train, fine-tune, or improve generalized artificial intelligence (AI) or machine learning (ML) models.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                  <span><strong>Human Access Restrictions:</strong> No human beings at JobTrack have access to read your personal email messages, unless: (1) you have provided explicit affirmative agreement for specific debugging; (2) it is necessary for security investigations; or (3) it is required by applicable law.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: How We Use Your Information */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
            <Globe className="w-5 h-5 text-zinc-700" />
            3. How We Use Collected Data
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            We use the information we collect solely for the following legitimate purposes:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-700 leading-relaxed">
            <li>To organize, track, and visualize your job applications on interactive Kanban boards and lists.</li>
            <li>To remind you of upcoming interview appointments and online assessment submission deadlines.</li>
            <li>To calculate recruitment statistics (CTC package analytics, offer rates, round conversion ratios).</li>
            <li>To parse job description keywords and provide match ratings for your resumes.</li>
            <li>To present classified recruitment email events for your review and one-click ledger approval.</li>
          </ul>
        </section>

        {/* Section 4: Data Retention & Security */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
            <Lock className="w-5 h-5 text-zinc-700" />
            4. Data Retention & Security Measures
          </h2>
          <div className="space-y-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
            <p>
              We implement industry-standard technical and operational safeguards to protect your personal information:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 space-y-1">
                <div className="font-semibold text-xs text-[#1A1A1A]">Encryption in Transit</div>
                <p className="text-[11px] text-zinc-500">All data transmitted between your browser and our servers is secured using TLS/HTTPS encryption.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 space-y-1">
                <div className="font-semibold text-xs text-[#1A1A1A]">Authentication Tokens</div>
                <p className="text-[11px] text-zinc-500">Google OAuth tokens are temporary, scoped to your session, and stored with strict access controls.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 space-y-1">
                <div className="font-semibold text-xs text-[#1A1A1A]">Data Minimization</div>
                <p className="text-[11px] text-zinc-500">We do not store complete mailbox archives. We only retain classified metadata (company, role, stage) that you approve into your ledger.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 space-y-1">
                <div className="font-semibold text-xs text-[#1A1A1A]">Client-Side Resume Isolation</div>
                <p className="text-[11px] text-zinc-500">Your resume PDFs remain in your browser&apos;s local storage, keeping sensitive personal CV data in your direct custody.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Your Rights & How to Revoke Access */}
        <section className="space-y-4 p-6 rounded-2xl bg-zinc-50 border border-zinc-200">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">
              5. Your Rights, Data Deletion & Revoking Access
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            You maintain full sovereignty over your personal data and account connections at all times:
          </p>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1.5">
              <h3 className="font-bold text-[#1A1A1A]">Revoke Google Mailbox Access</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                You can disconnect your Gmail account directly at any time in the <strong>Gmail Sync</strong> tab by clicking <strong>&quot;Disconnect Gmail&quot;</strong>. Alternatively, you can instantly revoke access across all Google services at:
              </p>
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                Google Account Security &amp; Permissions (myaccount.google.com/permissions)
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1.5">
              <h3 className="font-bold text-[#1A1A1A]">Data Deletion &amp; Export</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                You can delete individual job applications, interview timelines, or review events at any moment. You can also clear all cached records or contact us to delete your entire student profile from our database.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Contact Information */}
        <section className="space-y-3 border-t border-[#E5E5E1] pt-6">
          <h2 className="text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-zinc-700" />
            6. Contact &amp; Questions
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            If you have questions, concerns, or requests regarding this Privacy Policy, your personal data, or our Google API integration, please reach out to:
          </p>
          <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1 text-xs text-zinc-700">
            <div className="font-semibold text-[#1A1A1A]">JobTrack Placement Portal Privacy Administration</div>
            <div>Email: <a href="mailto:dtanishsai@gmail.com" className="text-indigo-600 underline font-medium">dtanishsai@gmail.com</a></div>
            <div className="text-zinc-500 text-[11px]">Authorized Application Domain: Personal Placement Portal, Google AI Studio Build</div>
          </div>
        </section>

        {/* Bottom Back Button */}
        <div className="pt-6 border-t border-[#E5E5E1] flex items-center justify-between">
          <button
            onClick={onBackToApp}
            className="px-5 py-2.5 rounded-xl bg-[#1A1A1A] text-white hover:bg-black text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Job Application Tracker</span>
          </button>
          <span className="text-xs text-zinc-400">© 2026 JobTrack. All rights reserved.</span>
        </div>

      </main>
    </div>
  );
};
