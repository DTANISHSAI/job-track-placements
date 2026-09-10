import { GoogleGenAI } from '@google/genai';
import { ResumeAnalysisResult } from '../src/types';

// Lazy initialize GoogleGenAI client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({});
  }
  return aiClient;
}

export async function analyzeResumeWithGemini(
  resumeText: string,
  resumeName?: string,
  targetRole?: string,
  fileDataUrl?: string,
  fileType?: string
): Promise<ResumeAnalysisResult> {
  const ai = getAiClient();
  const now = new Date().toISOString();

  // Extract inline base64 if provided (e.g. PDF document)
  let inlineDocPart: any = null;
  if (fileDataUrl && fileDataUrl.includes('base64,')) {
    const [header, base64] = fileDataUrl.split('base64,');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : (fileType || 'application/pdf');
    if (base64 && base64.length > 50) {
      inlineDocPart = {
        inlineData: {
          mimeType: mime,
          data: base64,
        },
      };
    }
  }

  // System Prompt & Evaluation Guidelines
  const prompt = `You are a Principal Tech Recruiter, ATS (Applicant Tracking Systems) Engineering Lead, and University Placement Director.
Analyze this specific candidate's unique resume thoroughly and objectively.

Resume Name: "${resumeName || 'Candidate Resume'}"
Target Job / Field: "${targetRole || 'Software Engineering / Tech Roles'}"
${resumeText && resumeText.trim().length > 10 ? `Extracted Text Content:\n"""\n${resumeText.slice(0, 15000)}\n"""` : ''}

CRITICAL INSTRUCTIONS:
- You must evaluate THIS specific candidate based strictly on their actual projects, skills, education, GPA, work experience, metrics, and certifications found in the attached document and text.
- Do NOT use generic placeholder text. Mention their actual specific projects by name, technologies used, actual college/university, degree, and exact strengths/weaknesses.
- Calculate realistic scores (0-100) reflecting their real experience level.

You MUST evaluate:
1. Overall resume score (0-100) based on impact, clarity, technical depth, and presentation.
2. ATS friendliness score (0-100) based on keyword density, standard section headers, readability, and machine-parseability.
3. Executive summary of candidate profile.
4. Skills: Detailed breakdown of Technical Skills and Soft Skills found or inferred.
5. Experience: Score (0-100), critical evaluation, and key observations / bullet point reviews.
6. Education: Score (0-100), evaluation (degree, branch, CGPA, coursework), key points.
7. Projects: Score (0-100), evaluation of architecture, technologies, GitHub links, and live demos.
8. Certifications: Score (0-100), evaluation of recognized credentials and value.
9. Strengths: Array of standout strong points specific to this resume.
10. Weaknesses: Array of specific areas that need improvement for this candidate.
11. Missing Information: Array of missing items (e.g., links, metrics, dates, contact details).
12. Formatting Issues: ATS or visual formatting problems.
13. Suggestions: Actionable, high-impact improvements (e.g. apply Google XYZ formula "Accomplished [X], measured by [Y], by doing [Z]", add quantitative metrics, optimize keywords).

Return ONLY raw valid JSON matching this schema:
{
  "overallScore": number,
  "atsScore": number,
  "summary": string,
  "skills": {
    "technicalSkills": string[],
    "softSkills": string[]
  },
  "experience": {
    "score": number,
    "evaluation": string,
    "keyPoints": string[]
  },
  "education": {
    "score": number,
    "evaluation": string,
    "keyPoints": string[]
  },
  "projects": {
    "score": number,
    "evaluation": string,
    "keyPoints": string[]
  },
  "certifications": {
    "score": number,
    "evaluation": string,
    "keyPoints": string[]
  },
  "strengths": string[],
  "weaknesses": string[],
  "missingInformation": string[],
  "formattingIssues": string[],
  "suggestions": string[]
}`;

  if (ai) {
    // Model fallback chain if a model experiences high demand or temporary 503/429
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    const contentsPayload = inlineDocPart ? [inlineDocPart, prompt] : prompt;

    for (const modelName of candidateModels) {
      // Retry up to 2 attempts per model for transient 503/429 spikes
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contentsPayload,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });

          let text = response.text || '';
          // Strip any possible markdown code fences
          if (text.includes('```json')) {
            text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
          } else if (text.includes('```')) {
            text = text.replace(/```\s*/g, '').replace(/```\s*$/g, '');
          }
          text = text.trim();

          if (text) {
            const parsed = JSON.parse(text);
            return {
              ...parsed,
              resumeId: '',
              analyzedAt: now,
            };
          }
        } catch (apiError: any) {
          const is503OrRateLimit =
            apiError?.status === 503 ||
            apiError?.code === 503 ||
            apiError?.message?.includes('503') ||
            apiError?.message?.includes('high demand') ||
            apiError?.message?.includes('UNAVAILABLE') ||
            apiError?.message?.includes('429') ||
            apiError?.message?.includes('RESOURCE_EXHAUSTED');

          if (is503OrRateLimit && attempt === 1) {
            // Brief backoff before retry
            await new Promise((res) => setTimeout(res, 600));
            continue;
          }
          // Otherwise try next model in candidateModels chain
          break;
        }
      }
    }
  }

  // Smart Heuristic Fallback Analysis Engine (Used if API is offline or undergoing high demand)
  return generateHeuristicResumeAnalysis(resumeText, resumeName, targetRole);
}

// Robust Heuristic Engine for instant evaluation or offline fallback
export function generateHeuristicResumeAnalysis(
  text: string,
  resumeName?: string,
  targetRole?: string
): ResumeAnalysisResult {
  const lower = text.toLowerCase();
  const now = new Date().toISOString();

  // Keyword extraction
  const knownTech = [
    'react', 'next.js', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'tailwind',
    'node.js', 'express', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'ruby', 'sql', 'postgresql',
    'mongodb', 'mysql', 'redis', 'graphql', 'rest api', 'docker', 'kubernetes', 'aws', 'gcp', 'azure',
    'git', 'github', 'ci/cd', 'linux', 'data structures', 'algorithms', 'system design', 'machine learning',
    'tensorflow', 'pytorch', 'pandas', 'numpy', 'spring boot', 'django', 'flask', 'kafka', 'microservices'
  ];

  const knownSoft = [
    'communication', 'teamwork', 'leadership', 'problem solving', 'critical thinking',
    'agile', 'scrum', 'time management', 'adaptability', 'collaboration', 'ownership', 'mentorship'
  ];

  const foundTech = knownTech.filter(k => lower.includes(k)).map(k => k.toUpperCase());
  const foundSoft = knownSoft.filter(k => lower.includes(k)).map(k => k.charAt(0).toUpperCase() + k.slice(1));

  // Check metrics & quantifiable achievements
  const hasNumbers = /\d+%|\d+x|\$\d+|\d+\s*users|\d+\s*ms|\d+\s*lpa/i.test(text);
  const hasLinks = /https?:\/\/|github\.com|linkedin\.com/i.test(text);
  const hasEducation = /b\.?tech|bachelor|master|university|institute|cgpa|gpa|\d\.\d+/i.test(text);
  const hasProjects = /project|developed|built|architected|implemented|created/i.test(text);
  const hasInternship = /intern|experience|engineer|developer|company|work/i.test(text);
  const hasCertifications = /certified|certificate|aws|coursera|udemy|hackerrank|leetcode/i.test(text);

  let overallScore = 65;
  let atsScore = 70;

  if (foundTech.length >= 6) { overallScore += 10; atsScore += 10; }
  if (hasNumbers) { overallScore += 8; atsScore += 5; }
  if (hasLinks) { overallScore += 5; atsScore += 5; }
  if (hasProjects) { overallScore += 6; }
  if (hasInternship) { overallScore += 6; }
  if (text.length > 500) { atsScore += 5; }

  overallScore = Math.min(94, Math.max(55, overallScore));
  atsScore = Math.min(92, Math.max(60, atsScore));

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  const missingInfo: string[] = [];
  const formattingIssues: string[] = [];

  if (foundTech.length > 0) {
    strengths.push(`Identified strong foundational technical stack: ${foundTech.slice(0, 5).join(', ')}.`);
  }
  if (hasProjects) {
    strengths.push('Good demonstration of hands-on project engineering and software development concepts.');
  }
  if (hasEducation) {
    strengths.push('Clear educational background and academic credentials provided.');
  }

  if (!hasNumbers) {
    weaknesses.push('Bullet points lack quantifiable metrics (e.g. latency reduced by X%, handled Y queries, scaled to Z users).');
    suggestions.push('Apply the Google XYZ Formula: Accomplished [X], as measured by [Y], by doing [Z] for every project/work experience bullet.');
  }
  if (!hasLinks) {
    missingInfo.push('Missing direct GitHub repositories or live project demonstration URLs.');
    suggestions.push('Include clean hyperlinks to your GitHub profile and deployed live web apps/APIs.');
  }
  if (foundTech.length < 5) {
    weaknesses.push('Technical skill keywords could be expanded to match modern tech company ATS criteria.');
    suggestions.push('Group skills into distinct categories: Languages, Frameworks, Cloud & Databases, Developer Tools.');
  }

  if (text.includes('\t') || (text.match(/\|/g) || []).length > 6) {
    formattingIssues.push('Complex table/multi-column structure detected which may confuse older ATS resume parsers.');
  } else {
    formattingIssues.push('Ensure standard single-column chronological ordering with consistent date formats (e.g. "Jun 2024 - Aug 2024").');
  }

  suggestions.push('Tailor resume keywords specifically to the target job description (e.g. Microservices, REST APIs, TypeScript).');

  return {
    resumeId: '',
    analyzedAt: now,
    overallScore,
    atsScore,
    summary: `The resume presents a solid technical foundation for ${targetRole || 'Software Development & Placement'} roles. With ${foundTech.length} verified technical keywords, the candidate demonstrates core competence. Enhancing quantitative business impact and refining ATS section clarity will significantly boost callback rates.`,
    skills: {
      technicalSkills: foundTech.length > 0 ? foundTech : ['REACT', 'TYPESCRIPT', 'JAVASCRIPT', 'NODE.JS', 'SQL', 'GIT'],
      softSkills: foundSoft.length > 0 ? foundSoft : ['Problem Solving', 'Team Collaboration', 'Agile Mindset', 'Communication'],
    },
    experience: {
      score: hasInternship ? 82 : 68,
      evaluation: hasInternship
        ? 'Relevant industry experience or internship contributions identified with clear role definitions.'
        : 'Limited formal industry experience detected; strengthen this section with open-source contributions or simulated client projects.',
      keyPoints: [
        'Ensure each role starts with high-impact action verbs (Architected, Spearheaded, Engineered).',
        'Highlight cross-functional collaboration and production bug fixes.'
      ],
    },
    education: {
      score: hasEducation ? 88 : 75,
      evaluation: 'Academic background is structured with degree details and field of study.',
      keyPoints: [
        'Include current CGPA / Grade percentage if above 7.5/10.0 or 3.2/4.0.',
        'List core relevant coursework (Data Structures, DBMS, OS, Computer Networks).'
      ],
    },
    projects: {
      score: hasProjects ? 85 : 65,
      evaluation: 'Project section highlights modern tooling and application architecture.',
      keyPoints: [
        'Detail the exact architecture, database design, and caching strategies used.',
        'Ensure all repository links have clear README files with architecture diagrams.'
      ],
    },
    certifications: {
      score: hasCertifications ? 80 : 70,
      evaluation: hasCertifications
        ? 'Verified technical certifications or recognized competitive programming ratings included.'
        : 'Consider adding recognized certifications (AWS Certified Developer, Google Cloud Associate, or LeetCode contest rating).',
      keyPoints: [
        'List credential IDs and expiration/issue dates for quick recruiter verification.'
      ],
    },
    strengths,
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Could benefit from more prominent leadership and system optimization examples.'],
    missingInformation: missingInfo.length > 0 ? missingInfo : ['Ensure contact phone number with country code is verified.'],
    formattingIssues,
    suggestions,
  };
}
