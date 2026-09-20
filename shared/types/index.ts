// ============================================================
// HireFlow — Shared Type Definitions
// ============================================================

// ---- Enums ----

export type RequirementCategory =
  | 'technical_skill'
  | 'soft_skill'
  | 'experience'
  | 'education'
  | 'certification'
  | 'domain_knowledge'
  | 'responsibility'
  | 'other';

export type RequirementPriority = 'required' | 'preferred' | 'nice_to_have';

export type EvidenceStatus = 'SUPPORTED' | 'PARTIAL' | 'NOT_FOUND' | 'UNCLEAR';

export type InterviewStatus = 'not_started' | 'questions_generated' | 'in_progress' | 'completed' | 'evaluated';

export type JobStatus = 'draft' | 'active' | 'closed';

export type QuestionCategory =
  | 'technical'
  | 'project_deep_dive'
  | 'experience_validation'
  | 'requirement_validation'
  | 'behavioral'
  | 'situational'
  | 'follow_up';

// ---- Core Entities ----

export interface Recruiter {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  raw_text: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  // Computed
  candidate_count?: number;
  interview_count?: number;
  requirements?: JobRequirement[];
}

export interface JobRequirement {
  id: string;
  job_id: string;
  category: RequirementCategory;
  text: string;
  priority: RequirementPriority;
  is_required: boolean;
  created_at: string;
}

export interface Candidate {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string;
  raw_text: string;
  file_name: string;
  file_type: string;
  parsed_profile: CandidateParsedProfile;
  created_at: string;
  // Computed
  skills?: CandidateSkill[];
  experience?: CandidateExperience[];
  education?: CandidateEducation[];
  projects?: CandidateProject[];
  certifications?: CandidateCertification[];
  evidence_mappings?: EvidenceMapping[];
  groups?: CandidateGroup[];
  interview_status?: InterviewStatus;
  requirement_coverage?: RequirementCoverage;
}

export interface CandidateParsedProfile {
  summary: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  skills: string[];
  total_experience_years?: number;
  achievements?: string[];
}

export interface CandidateSkill {
  id: string;
  candidate_id: string;
  skill: string;
  proficiency: string;
  source_text: string;
  source_location: string;
}

export interface CandidateExperience {
  id: string;
  candidate_id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
  source_text: string;
}

export interface CandidateEducation {
  id: string;
  candidate_id: string;
  degree: string;
  institution: string;
  year: string;
  field: string;
  source_text: string;
}

export interface CandidateProject {
  id: string;
  candidate_id: string;
  name: string;
  description: string;
  technologies: string[];
  source_text: string;
}

export interface CandidateCertification {
  id: string;
  candidate_id: string;
  name: string;
  issuer: string;
  year: string;
  source_text: string;
}

export interface EvidenceMapping {
  id: string;
  candidate_id: string;
  requirement_id: string;
  status: EvidenceStatus;
  evidence_text: string;
  source_location: string;
  confidence: number;
  validation_question: string;
  ai_reasoning: string;
  created_at: string;
  // Joined
  requirement?: JobRequirement;
}

export interface RequirementCoverage {
  total: number;
  supported: number;
  partial: number;
  not_found: number;
  unclear: number;
  coverage_percentage: number;
}

export interface CandidateGroup {
  id: string;
  candidate_id: string;
  group_name: string;
  reasoning: string;
  created_at: string;
}

// ---- Interview ----

export interface InterviewSession {
  id: string;
  candidate_id: string;
  job_id: string;
  interviewer_notes: string;
  raw_notes_text: string;
  status: InterviewStatus;
  created_at: string;
  updated_at: string;
  // Joined
  questions?: InterviewQuestion[];
  evidence?: InterviewEvidence[];
  evaluation?: InterviewEvaluation;
}

export interface InterviewQuestion {
  id: string;
  session_id: string;
  candidate_id: string;
  category: QuestionCategory;
  question: string;
  context: string;
  requirement_id: string | null;
  priority: number;
  is_answered: boolean;
}

export interface InterviewEvidence {
  id: string;
  session_id: string;
  requirement_id: string;
  evidence_text: string;
  source: string;
  status: EvidenceStatus;
  notes: string;
}

export interface InterviewEvaluation {
  id: string;
  session_id: string;
  summary: string;
  unanswered_areas: UnansweredArea[];
  requirement_coverage: InterviewRequirementCoverage[];
  created_at: string;
}

export interface UnansweredArea {
  requirement_id: string;
  requirement_text: string;
  reason: string;
  suggested_follow_up: string;
}

export interface InterviewRequirementCoverage {
  requirement_id: string;
  requirement_text: string;
  resume_status: EvidenceStatus;
  interview_status: EvidenceStatus;
  combined_evidence: string;
  notes: string;
}

// ---- Audit ----

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  ai_model: string;
  ai_prompt_summary: string;
  source_references: SourceReference[];
  created_at: string;
}

export interface SourceReference {
  type: 'resume' | 'job_description' | 'interview_notes' | 'requirement';
  id: string;
  location: string;
  snippet: string;
}

// ---- Search ----

export interface SearchResult {
  candidate_id: string;
  candidate_name: string;
  job_id: string;
  job_title: string;
  relevance_score: number;
  matched_chunks: MatchedChunk[];
}

export interface MatchedChunk {
  text: string;
  source_type: string;
  score: number;
}

// ---- Candidate Summary ----

export interface CandidateSummaryData {
  overview: string;
  relevant_experience: string[];
  relevant_skills: string[];
  relevant_projects: string[];
  requirement_coverage_summary: string;
  evidence_strength: string;
  missing_information: string[];
  items_requiring_validation: string[];
}

// ---- API Request/Response Types ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  recruiter: Recruiter;
}

export interface CreateJobRequest {
  title: string;
  department: string;
  location: string;
  description: string;
}

export interface AnalyzeJobResponse {
  job_id: string;
  requirements: JobRequirement[];
}

export interface UpdateRequirementsRequest {
  requirements: Omit<JobRequirement, 'id' | 'job_id' | 'created_at'>[];
}

export interface CandidateUploadResponse {
  candidates: Candidate[];
  errors: { file_name: string; error: string }[];
}

export interface GenerateQuestionsRequest {
  candidate_id: string;
  job_id: string;
  focus_areas?: string[];
}

export interface SubmitInterviewNotesRequest {
  session_id: string;
  notes: string;
}

export interface SearchRequest {
  query: string;
  job_id?: string;
  filters?: {
    skills?: string[];
    min_experience?: number;
    education?: string;
    group?: string;
  };
  limit?: number;
}

export interface DashboardStats {
  active_jobs: number;
  total_candidates: number;
  interviews_completed: number;
  candidates_requiring_validation: number;
  recent_activity: ActivityItem[];
  recent_jobs: Job[];
}

export interface ActivityItem {
  id: string;
  type: 'job_created' | 'candidate_uploaded' | 'interview_completed' | 'analysis_complete';
  title: string;
  description: string;
  timestamp: string;
  entity_id: string;
  entity_type: string;
}
