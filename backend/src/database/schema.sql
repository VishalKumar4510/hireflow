-- ============================================================
-- HireFlow Database Schema
-- PostgreSQL with pgvector
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ---- Recruiters ----
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- Jobs ----
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  department VARCHAR(255) DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  description TEXT NOT NULL,
  raw_text TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- Job Requirements ----
CREATE TABLE IF NOT EXISTS job_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'required' CHECK (priority IN ('required', 'preferred', 'nice_to_have')),
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- Candidates ----
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL DEFAULT 'Unknown',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(100) DEFAULT '',
  raw_text TEXT DEFAULT '',
  file_name VARCHAR(500) DEFAULT '',
  file_type VARCHAR(50) DEFAULT '',
  parsed_profile JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- Candidate Skills ----
CREATE TABLE IF NOT EXISTS candidate_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill VARCHAR(255) NOT NULL,
  proficiency VARCHAR(50) DEFAULT 'mentioned',
  source_text TEXT DEFAULT '',
  source_location VARCHAR(255) DEFAULT ''
);

-- ---- Candidate Experience ----
CREATE TABLE IF NOT EXISTS candidate_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL DEFAULT '',
  company VARCHAR(500) NOT NULL DEFAULT '',
  duration VARCHAR(255) DEFAULT '',
  description TEXT DEFAULT '',
  source_text TEXT DEFAULT ''
);

-- ---- Candidate Education ----
CREATE TABLE IF NOT EXISTS candidate_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  degree VARCHAR(500) DEFAULT '',
  institution VARCHAR(500) DEFAULT '',
  year VARCHAR(50) DEFAULT '',
  field VARCHAR(255) DEFAULT '',
  source_text TEXT DEFAULT ''
);

-- ---- Candidate Projects ----
CREATE TABLE IF NOT EXISTS candidate_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name VARCHAR(500) DEFAULT '',
  description TEXT DEFAULT '',
  technologies TEXT[] DEFAULT '{}',
  source_text TEXT DEFAULT ''
);

-- ---- Candidate Certifications ----
CREATE TABLE IF NOT EXISTS candidate_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name VARCHAR(500) DEFAULT '',
  issuer VARCHAR(500) DEFAULT '',
  year VARCHAR(50) DEFAULT '',
  source_text TEXT DEFAULT ''
);

-- ---- Evidence Mappings ----
CREATE TABLE IF NOT EXISTS evidence_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES job_requirements(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'NOT_FOUND' CHECK (status IN ('SUPPORTED', 'PARTIAL', 'NOT_FOUND', 'UNCLEAR')),
  evidence_text TEXT DEFAULT '',
  source_location VARCHAR(500) DEFAULT '',
  confidence REAL DEFAULT 0.0,
  validation_question TEXT DEFAULT '',
  ai_reasoning TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- Candidate Groups ----
CREATE TABLE IF NOT EXISTS candidate_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  group_name VARCHAR(255) NOT NULL,
  reasoning TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- Interview Sessions ----
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  interviewer_notes TEXT DEFAULT '',
  raw_notes_text TEXT DEFAULT '',
  status VARCHAR(30) DEFAULT 'not_started' CHECK (status IN ('not_started', 'questions_generated', 'in_progress', 'completed', 'evaluated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- Interview Questions ----
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  question TEXT NOT NULL,
  context TEXT DEFAULT '',
  requirement_id UUID REFERENCES job_requirements(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 1,
  is_answered BOOLEAN DEFAULT false
);

-- ---- Interview Evidence ----
CREATE TABLE IF NOT EXISTS interview_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES job_requirements(id) ON DELETE CASCADE,
  evidence_text TEXT DEFAULT '',
  source VARCHAR(255) DEFAULT 'interview',
  status VARCHAR(20) DEFAULT 'NOT_FOUND' CHECK (status IN ('SUPPORTED', 'PARTIAL', 'NOT_FOUND', 'UNCLEAR')),
  notes TEXT DEFAULT ''
);

-- ---- Interview Evaluations ----
CREATE TABLE IF NOT EXISTS interview_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  summary TEXT DEFAULT '',
  unanswered_areas JSONB DEFAULT '[]',
  requirement_coverage JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---- Embeddings ----
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type VARCHAR(50) NOT NULL,
  source_id UUID NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS embeddings_hnsw_idx ON embeddings USING hnsw (embedding vector_cosine_ops);

-- ---- Audit Log ----
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  ai_model VARCHAR(100) DEFAULT '',
  ai_prompt_summary TEXT DEFAULT '',
  source_references JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_evidence_candidate ON evidence_mappings(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evidence_requirement ON evidence_mappings(requirement_id);
CREATE INDEX IF NOT EXISTS idx_requirements_job ON job_requirements(job_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate ON interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_session ON interview_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
