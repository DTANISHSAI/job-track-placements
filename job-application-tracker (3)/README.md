# Job Application Tracker — Personal Placement Portal

A centralized placement tracking and career preparation platform designed for college students and engineering graduates. Manage your on-campus and off-campus recruitment pipeline, CTC packages, interview schedules, ATS-optimized resumes with Google Gemini AI evaluations, and automated Gmail recruitment email sync.

---

## Key Features

### 1. Personal Placement Portal & Application Pipeline
- **Recruitment Lifecycle**: Track job applications through all hiring stages — *Applied*, *Online Assessment*, *Technical Interview*, *HR Round*, *Selected / Offer Received*, and *Rejected*.
- **Interactive Kanban & List Views**: Drag-and-drop or filter job cards across recruitment stages, sort by package, date, or status.
- **CTC & Offer Management**: Record and track compensation details (LPA, fixed vs. variable), job types (Full-Time, Internship, FTE + 6M Intern), work locations, and deadlines.
- **Offer Celebrations**: Instant interactive celebration confetti upon logging successful placement offers.
 
### 2. Smart Gmail AI Job Email Sync & Review Hub
- **Automated Mailbox Classification**: Detects recruitment emails from recruiters, ATS platforms (Workday, Greenhouse, Lever, HackerRank), and campus placement cells.
- **Gemini AI Extraction**: Analyzes incoming messages to extract company names, job roles, stage updates, Online Assessment (OA) test links, interview dates/times, and offer letters.
- **Confidence Scoring & Safe Sync (≥90%)**: High-confidence classification filter ensures automated changes don't corrupt your placement records without your approval.
- **Review & Merge Ledger**: Interactive interface to approve, edit, or dismiss detected updates before applying them to your application tracker.
- **Google OAuth Integration**: Connect your real Gmail via Google Identity Services (GIS) / OAuth 2.0.

### 3. Gemini AI Resume Analyzer & ATS Scorecard
- **Multimodal Document Evaluation**: Powered by Google Gemini API via the `@google/genai` SDK (`gemini-3.8-flash` with automatic fallback cascade).
- **ATS Compatibility Score**: Quantitative score (0–100) assessing keyword relevance, structural formatting, and parser readability.
- **Deep Section Breakdown**:
  - Executive Profile Summary.
  - Verified technical and soft skills inventory.
  - Section-by-section analysis (Experience, Projects, Education, Certifications).
  - High-impact bullet point improvements applying the Google XYZ formula (*"Accomplished [X], measured by [Y], by doing [Z]"*).
- **Role-Specific Targeting**: Optimize resumes for specific roles (e.g. SDE-1, Frontend Engineer, Backend, DevOps, Data Analyst).

### 4. Interview Scheduler & Countdown Timeline
- **Round Coordination**: Organize upcoming interviews by round type (Coding OA, Technical 1 & 2, System Design, HR / Managerial).
- **Time-Aware Countdown Badges**: Color-coded countdown badges (*Today*, *Tomorrow*, *In X days*, *Completed*).
- **Meeting Links & Notes**: Store one-click links (Google Meet, Zoom, Microsoft Teams) alongside interviewer names and preparation notes.

### 5. Academic Profile & LeetCode Stats
- **Student Profile**: Customize university details, branch, graduation year, CGPA, target CTC, skills, and social links (GitHub, LinkedIn).
- **LeetCode Integration**: Track solved problem metrics (Easy, Medium, Hard), global ranking, and achievement badges directly on your dashboard.

### 6. Authentication & Session Privacy
- **Clean Guest Landing**: When opening the portal, visitors start in a clean signed-out state — personal placement records remain private and secure.
- **Email & Password Authentication**: Secure registration with optional OTP verification via SMTP/Resend.
- **On-Demand Demo Exploration**: Visitors can explicitly choose **"Load Sample Data / Demo Account"** (Shaurya Vardhan) from the welcome screen or sign-in modal to explore pre-loaded campus drive data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS v4 |
| **Icons & Motion** | Lucide React, Motion (`motion/react`), Canvas Confetti |
| **PDF Text Parsing** | Mozilla `pdfjs-dist` |
| **Backend / API** | Node.js, Express 4, `tsx` / `esbuild` |
| **Database** | MongoDB / Firestore (with in-memory fallback repository) |
| **AI / LLM** | Google Gemini API via `@google/genai` TypeScript SDK |
| **Email Delivery** | Nodemailer (SMTP) / Resend |
| **Auth / OAuth** | Google Identity Services (GIS), Firebase Auth, JWT Sessions |

---

## Project Structure

```
├── server.ts                       # Express backend entry point & REST API routes
├── server/
│   ├── aiAnalyzer.ts               # Gemini AI resume analyzer & fallback engine
│   ├── gmailClassifier.ts          # AI email classification and regex heuristics
│   ├── gmailSyncService.ts         # Gmail sync manager, token handling & email parsing
│   ├── email.ts                    # Nodemailer / Resend OTP verification service
│   ├── models.ts                   # Core TypeScript domain models & schemas
│   ├── mongo.ts                    # MongoDB client & connection pooling
│   └── repository.ts               # Unified database repository (MongoDB + fallback)
├── src/
│   ├── main.tsx                    # React client entry point
│   ├── App.tsx                     # Primary layout, tab routing & authenticated views
│   ├── types.ts                    # Shared TypeScript interfaces & types
│   ├── index.css                   # Tailwind CSS global stylesheet
│   ├── context/
│   │   ├── AuthContext.tsx         # Session state, explicit logout & demo gating
│   │   └── ToastContext.tsx        # Toast alert notification provider
│   ├── components/
│   │   ├── Navbar.tsx              # Brand header, navigation tabs & user profile menu
│   │   ├── DashboardStats.tsx      # Overview metrics, package cards & charts
│   │   ├── ApplicationsList.tsx    # Table & card list view with search & filters
│   │   ├── KanbanBoard.tsx         # Drag-and-drop recruitment stage board
│   │   ├── ApplicationModal.tsx    # Add / Edit application modal
│   │   ├── UpcomingInterviews.tsx  # Interview calendar & countdown list
│   │   ├── InterviewModal.tsx      # Schedule / edit interview round modal
│   │   ├── ResumeManagementView.tsx# Local IndexedDB resume storage & manager
│   │   ├── ResumeAnalyzerModal.tsx # Gemini AI ATS scorecard & feedback report
│   │   ├── ResumePreviewModal.tsx  # In-app PDF resume preview
│   │   ├── GmailReviewView.tsx     # Gmail connection, review ledger & demo emails
│   │   ├── ProfileModal.tsx        # Academic profile & LeetCode configuration
│   │   ├── StudentProfileCard.tsx  # LeetCode badges & student info card
│   │   ├── AnalyticsView.tsx       # Placement drive statistics & charts
│   │   ├── DeleteConfirmModal.tsx  # Safe deletion confirmation dialog
│   │   └── AuthModal.tsx           # Sign-in, registration, and OTP verification modal
│   └── services/
│       ├── api.ts                  # Typed client-side API client
│       ├── gmailClient.ts          # Google Identity Services (GIS) token client
│       ├── firebaseAuth.ts         # Google Sign-In popup fallback
│       └── localResumeStore.ts     # Client-side IndexedDB store & PDF text extractor
├── metadata.json                   # Applet configuration & permissions
├── .env.example                    # Environment variables documentation
└── package.json                    # Dependencies & build scripts
```

---

## Getting Started

### Prerequisites
- Node.js 20+ installed
- Google Gemini API Key (set as `GEMINI_API_KEY`)
- *(Optional)* MongoDB connection string or Firebase Firestore
- *(Optional)* SMTP credentials for OTP delivery

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd job-application-tracker
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and provide your secrets:
```bash
cp .env.example .env
```

Key environment variables:
```env
# Gemini API Key (Required for AI Resume Analysis & Email Classification)
GEMINI_API_KEY="your_gemini_api_key_here"

# Database Connection (Optional, falls back to in-memory/local storage)
MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/placement_tracker"

# Application URL
APP_URL="http://localhost:3000"

# Optional: SMTP email configuration for registration OTP verification
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="Personal Placement Portal <noreply@placementtracker.edu>"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## Gmail Integration

Connect your Gmail account to automatically detect and classify recruitment updates:
1. Click **"Connect Gmail"** in the Gmail Sync tab.
2. Grant permission to scan mailbox messages for recruitment notifications (`gmail.readonly`).
3. The portal searches your inbox for emails from recruiters, campus placement cells, and ATS systems, and sends snippets to Gemini AI to extract company names, interview rounds, assessment links, and offer details.
4. Review detected recruitment events in the review ledger and click **Approve** to update your placement tracker.

---

## Privacy Architecture & Legal Compliance

- **Publicly Accessible Privacy Policy**: Accessible at `/privacy` without requiring login or authentication, compliant with Google API Services User Data Policy and OAuth verification requirements.
- **Google API Services User Data Policy Compliance**: Strict adherence to the Google Limited Use requirements. Gmail read-only access (`gmail.readonly`) is used solely to parse recruitment updates. Data is never sold, never used for advertising, never used to train generalized AI/ML models, and never accessed by humans without affirmative user consent.
- **Local-First Resumes**: Uploaded PDF/DOCX resumes are stored locally in browser **IndexedDB**, guaranteeing privacy. Only minimal metadata (filename, upload date) is synced to the backend.
- **Server-Side AI Proxy**: All Gemini API calls are securely proxied through Express API endpoints (`/api/resumes/analyze` and `/api/gmail/classify-email`), ensuring API keys are never exposed to the client.
- **Signed-Out Privacy**: Applications, interview rounds, and profile details are cleared from the screen upon logout and will not auto-populate for fresh visitors until authenticated.

---

## License

MIT License. Designed for personal career planning and university placement preparation.
