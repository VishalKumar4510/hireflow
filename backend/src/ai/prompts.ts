// ============================================================
// AI Prompt Templates
// All prompts used by HireFlow for AI operations
// ============================================================

export const PROMPTS = {
  // ---- Job Requirement Extraction ----
  EXTRACT_JOB_REQUIREMENTS: `Analyze the following job description and extract ALL requirements.

JOB DESCRIPTION:
{{jobDescription}}

Extract requirements into these categories:
- technical_skill: Programming languages, frameworks, tools, platforms
- soft_skill: Communication, leadership, teamwork, problem-solving
- experience: Years of experience, specific domain experience
- education: Degrees, fields of study
- certification: Professional certifications
- domain_knowledge: Industry-specific knowledge
- responsibility: Key job responsibilities
- other: Any other explicit requirements

For each requirement, determine:
- category: One of the categories above
- text: Clear, concise requirement statement
- priority: "required" if explicitly required/mandatory, "preferred" if nice-to-have/preferred, "nice_to_have" if only briefly mentioned
- is_required: true if the requirement is mandatory

RULES:
- Only extract explicitly stated requirements
- Do NOT infer requirements that are not mentioned
- Do NOT add generic requirements not in the job description
- Separate compound requirements into individual items
- Be specific — "3+ years Python experience" not just "Python"

Return JSON:
{
  "requirements": [
    {
      "category": "technical_skill",
      "text": "3+ years of Python experience",
      "priority": "required",
      "is_required": true
    }
  ]
}`,

  // ---- Resume Parsing ----
  PARSE_RESUME: `Parse the following resume text and extract structured information.

RESUME TEXT:
{{resumeText}}

Extract:
1. Contact information (name, email, phone, location, linkedin, github, website)
2. Professional summary
3. Skills (each skill as found, with proficiency level if mentioned and source text)
4. Work experience (title, company, duration, description with key achievements)
5. Education (degree, institution, year, field)
6. Projects (name, description, technologies used)
7. Certifications (name, issuer, year)
8. Achievements/Awards

RULES:
- Extract ONLY information explicitly present in the resume
- Do NOT infer skills that are not mentioned
- For example, if "Python" is mentioned, do NOT assume "Django" or "Flask"
- Preserve the exact wording from the resume for source_text fields
- If information is ambiguous or unclear, mark it as such
- Total experience years should be calculated from work history if dates are provided

Return JSON:
{
  "contact": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": ""
  },
  "summary": "",
  "total_experience_years": null,
  "skills": [
    { "skill": "", "proficiency": "mentioned|beginner|intermediate|advanced|expert", "source_text": "", "source_location": "Skills section" }
  ],
  "experience": [
    { "title": "", "company": "", "duration": "", "description": "", "source_text": "" }
  ],
  "education": [
    { "degree": "", "institution": "", "year": "", "field": "", "source_text": "" }
  ],
  "projects": [
    { "name": "", "description": "", "technologies": [], "source_text": "" }
  ],
  "certifications": [
    { "name": "", "issuer": "", "year": "", "source_text": "" }
  ],
  "achievements": []
}`,

  // ---- Evidence Mapping ----
  MAP_EVIDENCE: `Map the candidate's resume evidence against each job requirement.

JOB REQUIREMENTS:
{{requirements}}

CANDIDATE PROFILE:
{{candidateProfile}}

CANDIDATE RAW RESUME TEXT:
{{resumeText}}

For each requirement, determine:
- status: SUPPORTED (clear evidence), PARTIAL (some evidence but incomplete), NOT_FOUND (no evidence), UNCLEAR (ambiguous or contradictory)
- evidence_text: The exact text from the resume that supports or relates to this requirement
- source_location: Where in the resume this evidence was found (e.g., "Experience → Company X", "Skills section", "Project → Project Name")
- confidence: A float 0.0-1.0 indicating how confident you are in the mapping
- validation_question: A question to ask in an interview to validate or clarify this requirement
- ai_reasoning: Your reasoning for the status assignment

RULES:
- Only use EXPLICIT evidence from the resume — never infer
- If candidate says "Python" do NOT claim they know "Django" unless Django is explicitly mentioned
- If evidence is ambiguous, use UNCLEAR not SUPPORTED
- If evidence partially matches, use PARTIAL not SUPPORTED
- Every evidence_text must be a direct quote or close paraphrase from the resume
- validation_question should help clarify gaps, ambiguities, or deepen understanding
- Be honest about missing information — do NOT fill gaps with assumptions

Return JSON:
{
  "mappings": [
    {
      "requirement_id": "",
      "status": "SUPPORTED",
      "evidence_text": "Exact quote from resume",
      "source_location": "Experience → Company X",
      "confidence": 0.85,
      "validation_question": "Can you elaborate on...",
      "ai_reasoning": "The candidate explicitly mentions..."
    }
  ]
}`,

  // ---- Candidate Summary ----
  GENERATE_SUMMARY: `Generate a structured recruiter summary for this candidate.

JOB TITLE: {{jobTitle}}
JOB REQUIREMENTS: {{requirements}}

CANDIDATE PROFILE:
{{candidateProfile}}

EVIDENCE MAPPINGS:
{{evidenceMappings}}

Generate a summary with these sections:
1. overview: Brief 2-3 sentence overview of the candidate
2. relevant_experience: List of relevant experience items with evidence
3. relevant_skills: List of relevant skills with evidence
4. relevant_projects: List of relevant projects with evidence
5. requirement_coverage_summary: Overall assessment of how well evidence maps to requirements
6. evidence_strength: Assessment of the quality and clarity of the evidence
7. missing_information: List of information gaps
8. items_requiring_validation: List of items that need interview verification

RULES:
- Only reference explicitly stated information from the candidate's resume
- Never fabricate or assume skills, experience, or qualifications
- Do NOT compare this candidate to other candidates
- Do NOT make hiring recommendations
- Do NOT use language like "strong candidate" or "weak candidate"
- Focus on evidence-based observations
- Clearly distinguish between what is explicitly stated and what might be implied
- Use neutral, professional language

Return JSON:
{
  "overview": "",
  "relevant_experience": [],
  "relevant_skills": [],
  "relevant_projects": [],
  "requirement_coverage_summary": "",
  "evidence_strength": "",
  "missing_information": [],
  "items_requiring_validation": []
}`,

  // ---- Interview Question Generation ----
  GENERATE_INTERVIEW_QUESTIONS: `Generate interview questions for this candidate based on their profile and the job requirements.

JOB TITLE: {{jobTitle}}
JOB REQUIREMENTS: {{requirements}}

CANDIDATE PROFILE:
{{candidateProfile}}

EVIDENCE MAPPINGS:
{{evidenceMappings}}

FOCUS AREAS (if any): {{focusAreas}}

Generate questions in these categories:
- technical: Test technical knowledge related to requirements
- project_deep_dive: Explore specific projects mentioned in the resume
- experience_validation: Verify experience claims
- requirement_validation: Validate evidence for specific requirements
- behavioral: Assess soft skills and behavioral competencies
- situational: Present hypothetical scenarios relevant to the role
- follow_up: Questions to clarify gaps or unclear information

For each question, provide:
- category: One of the categories above
- question: The interview question
- context: Why this question is relevant (reference the requirement or evidence)
- requirement_id: The requirement this question validates (if applicable)
- priority: 1 (critical) to 5 (nice-to-have)

RULES:
- Questions should be specific to this candidate and role, not generic
- Reference specific projects, skills, or experience from the resume
- For UNCLEAR or NOT_FOUND requirements, generate validation questions
- Do NOT ask leading questions that assume the answer
- Include follow-up prompts for vague answers
- Mix question types for a balanced interview
- Generate 15-25 questions total

Return JSON:
{
  "questions": [
    {
      "category": "technical",
      "question": "You mentioned building a Node.js REST API...",
      "context": "Validates REST API experience requirement",
      "requirement_id": null,
      "priority": 1
    }
  ]
}`,

  // ---- Interview Analysis ----
  ANALYZE_INTERVIEW: `Analyze these interview notes and map evidence to job requirements.

JOB TITLE: {{jobTitle}}
JOB REQUIREMENTS: {{requirements}}

CANDIDATE PROFILE:
{{candidateProfile}}

EXISTING EVIDENCE MAPPINGS (from resume):
{{existingEvidence}}

INTERVIEW NOTES:
{{interviewNotes}}

For each requirement, analyze the interview notes and determine:
- If new evidence was provided during the interview
- If existing evidence was strengthened or weakened
- If previously unclear items were clarified
- What areas remain unanswered

Return JSON:
{
  "interview_evidence": [
    {
      "requirement_id": "",
      "evidence_text": "From interview: the candidate explained...",
      "source": "interview",
      "status": "SUPPORTED",
      "notes": "This validates the REST API experience claim"
    }
  ],
  "unanswered_areas": [
    {
      "requirement_id": "",
      "requirement_text": "",
      "reason": "Not addressed during interview",
      "suggested_follow_up": "In a follow-up, ask about..."
    }
  ],
  "summary": "Brief summary of key interview findings"
}`,

  // ---- Interview Evaluation Report ----
  GENERATE_EVALUATION: `Generate a standardized interview evaluation report.

JOB TITLE: {{jobTitle}}
JOB REQUIREMENTS: {{requirements}}

CANDIDATE PROFILE:
{{candidateProfile}}

RESUME EVIDENCE:
{{resumeEvidence}}

INTERVIEW EVIDENCE:
{{interviewEvidence}}

UNANSWERED AREAS:
{{unansweredAreas}}

Generate a comprehensive evaluation report:

1. summary: Overall summary of the evaluation process and findings
2. requirement_coverage: For each requirement, show:
   - requirement_id and text
   - resume_status: Evidence status from resume
   - interview_status: Evidence status from interview
   - combined_evidence: Synthesis of all evidence
   - notes: Any additional observations
3. unanswered_areas: Areas that still need follow-up

RULES:
- Do NOT make a hiring recommendation
- Do NOT rank this candidate against others
- Do NOT use language like "hire", "reject", "strong", "weak"
- Present facts and evidence objectively
- Clearly distinguish between resume evidence and interview evidence
- Highlight contradictions between resume and interview if any
- Use neutral, professional language throughout

Return JSON:
{
  "summary": "",
  "requirement_coverage": [
    {
      "requirement_id": "",
      "requirement_text": "",
      "resume_status": "SUPPORTED",
      "interview_status": "SUPPORTED",
      "combined_evidence": "",
      "notes": ""
    }
  ],
  "unanswered_areas": []
}`,

  // ---- Candidate Grouping ----
  GROUP_CANDIDATES: `Analyze these candidates and assign descriptive groups.

JOB TITLE: {{jobTitle}}
JOB REQUIREMENTS: {{requirements}}

CANDIDATES:
{{candidates}}

Assign each candidate to one or more of these descriptive groups:
- "Strong relevant experience evidence"
- "Backend-focused"
- "Frontend-focused"
- "Full-stack"
- "Project-heavy profile"
- "Industry-experience profile"
- "Missing key requirement evidence"
- "Requires validation"
- "Interview incomplete"
- "Recent graduate"
- "Career changer"
- "Specialist profile"
- "Generalist profile"

RULES:
- These are descriptive groupings, NOT quality rankings
- A candidate can belong to multiple groups
- Groups should be based on explicit evidence only
- Provide reasoning for each group assignment
- Do NOT imply that one group is better than another

Return JSON:
{
  "groupings": [
    {
      "candidate_id": "",
      "groups": [
        {
          "group_name": "",
          "reasoning": ""
        }
      ]
    }
  ]
}`,
};

export function fillPrompt(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}
