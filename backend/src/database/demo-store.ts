import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface DemoStore {
  recruiters: any[];
  jobs: any[];
  requirements: any[];
  candidates: any[];
  candidateSkills: any[];
  candidateExperience: any[];
  candidateEducation: any[];
  candidateProjects: any[];
  candidateCertifications: any[];
  evidenceMappings: any[];
  candidateGroups: any[];
  interviewSessions: any[];
  interviewQuestions: any[];
  interviewEvidence: any[];
  interviewEvaluations: any[];
  auditLogs: any[];
}

const DEMO_PASSWORD_HASH = bcrypt.hashSync('demo123', 10);

// Canonical valid RFC 4122 v4 UUIDs for all demo entities
export const DEMO_RECRUITER_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_JOB_ID = '00000000-0000-4000-8000-000000000002';
export const DEMO_C1_ID = '00000000-0000-4000-8000-000000000011';
export const DEMO_C2_ID = '00000000-0000-4000-8000-000000000012';
export const DEMO_SESSION_ID = '00000000-0000-4000-8000-000000000021';

export function createInitialDemoStore(): DemoStore {
  const recruiterId = DEMO_RECRUITER_ID;
  const jobId = DEMO_JOB_ID;
  const c1Id = DEMO_C1_ID;
  const c2Id = DEMO_C2_ID;
  const sessionId = DEMO_SESSION_ID;

  const requirements = [
    { id: '00000000-0000-4000-8000-000000000101', job_id: jobId, category: 'technical_skill', text: '5+ years experience with React and TypeScript', priority: 'required', is_required: true },
    { id: '00000000-0000-4000-8000-000000000102', job_id: jobId, category: 'technical_skill', text: 'Strong backend proficiency with Node.js and Express', priority: 'required', is_required: true },
    { id: '00000000-0000-4000-8000-000000000103', job_id: jobId, category: 'technical_skill', text: 'Relational database design and query optimization with PostgreSQL', priority: 'required', is_required: true },
    { id: '00000000-0000-4000-8000-000000000104', job_id: jobId, category: 'technical_skill', text: 'Experience with Docker and AWS container deployment (ECS/EKS)', priority: 'preferred', is_required: false },
    { id: '00000000-0000-4000-8000-000000000105', job_id: jobId, category: 'experience', text: 'Experience designing and maintaining public or internal RESTful APIs', priority: 'required', is_required: true },
    { id: '00000000-0000-4000-8000-000000000106', job_id: jobId, category: 'education', text: 'Bachelor’s degree in Computer Science or equivalent practical experience', priority: 'preferred', is_required: false },
    { id: '00000000-0000-4000-8000-000000000107', job_id: jobId, category: 'soft_skill', text: 'Proven ability to mentor junior engineers and conduct technical reviews', priority: 'preferred', is_required: false },
    { id: '00000000-0000-4000-8000-000000000108', job_id: jobId, category: 'domain_knowledge', text: 'Understanding of modern CI/CD pipelines and automated testing suites', priority: 'nice_to_have', is_required: false },
  ];

  const c1Skills = [
    { id: '00000000-0000-4000-8000-000000000201', candidate_id: c1Id, skill: 'React', proficiency: 'expert', source_text: 'Lead React architect for 4+ years', source_location: 'Skills' },
    { id: '00000000-0000-4000-8000-000000000202', candidate_id: c1Id, skill: 'TypeScript', proficiency: 'expert', source_text: 'Production TypeScript across frontend & backend', source_location: 'Skills' },
    { id: '00000000-0000-4000-8000-000000000203', candidate_id: c1Id, skill: 'Node.js', proficiency: 'advanced', source_text: 'Built Node.js microservices handling 2M req/day', source_location: 'Work Experience' },
    { id: '00000000-0000-4000-8000-000000000204', candidate_id: c1Id, skill: 'PostgreSQL', proficiency: 'advanced', source_text: 'Optimized complex SQL queries and schema indexing', source_location: 'Work Experience' },
    { id: '00000000-0000-4000-8000-000000000205', candidate_id: c1Id, skill: 'Docker', proficiency: 'intermediate', source_text: 'Dockerized microservices and configured compose', source_location: 'Work Experience' },
    { id: '00000000-0000-4000-8000-000000000206', candidate_id: c1Id, skill: 'AWS', proficiency: 'intermediate', source_text: 'Deployed containers to AWS ECS and Fargate', source_location: 'Work Experience' },
  ];

  const c1Experience = [
    { id: '00000000-0000-4000-8000-000000000301', candidate_id: c1Id, title: 'Senior Software Engineer', company: 'CloudScale Technologies', duration: '2021 - Present (3 yrs)', description: 'Architected customer-facing dashboard in React and TypeScript with Node.js backend. Led team of 4 engineers and improved response latency by 40%.' },
    { id: '00000000-0000-4000-8000-000000000302', candidate_id: c1Id, title: 'Full Stack Developer', company: 'Nexus Media Labs', duration: '2018 - 2021 (3 yrs)', description: 'Developed RESTful services and relational schemas with PostgreSQL and Express. Implemented automated CI/CD with GitHub Actions.' },
  ];

  const c1Education = [
    { id: '00000000-0000-4000-8000-000000000401', candidate_id: c1Id, degree: 'B.S. in Computer Science', institution: 'University of California, Berkeley', year: '2018', field: 'Computer Science' },
  ];

  const c1Projects = [
    { id: '00000000-0000-4000-8000-000000000501', candidate_id: c1Id, name: 'CloudScale Metric Stream', description: 'Real-time telemetry aggregation pipeline with Node.js and Redis streams.', technologies: ['Node.js', 'React', 'PostgreSQL', 'Redis'] },
  ];

  const c1Evidence = [
    { id: '00000000-0000-4000-8000-000000000601', candidate_id: c1Id, requirement_id: requirements[0].id, status: 'SUPPORTED', evidence_text: '6 years of experience using React and TypeScript across CloudScale and Nexus Media.', source_location: 'Work Experience & Summary', confidence: 0.95, validation_question: 'Can you discuss how you structured React state management in your largest project?', ai_reasoning: 'Direct explicit evidence found in candidate resume sections.', requirement_text: requirements[0].text, requirement_category: requirements[0].category, requirement_priority: requirements[0].priority },
    { id: '00000000-0000-4000-8000-000000000602', candidate_id: c1Id, requirement_id: requirements[1].id, status: 'SUPPORTED', evidence_text: 'Built Node.js microservices handling 2M req/day at CloudScale Technologies.', source_location: 'Work Experience → CloudScale', confidence: 0.92, validation_question: 'What patterns do you use for error handling and logging across Node.js services?', ai_reasoning: 'Direct explicit evidence found in candidate resume sections.', requirement_text: requirements[1].text, requirement_category: requirements[1].category, requirement_priority: requirements[1].priority },
    { id: '00000000-0000-4000-8000-000000000603', candidate_id: c1Id, requirement_id: requirements[2].id, status: 'SUPPORTED', evidence_text: 'Optimized complex SQL queries and schema indexing in PostgreSQL at Nexus Media Labs.', source_location: 'Work Experience → Nexus Media', confidence: 0.90, validation_question: 'How do you approach indexing and query performance analysis in PostgreSQL?', ai_reasoning: 'Direct explicit evidence found in candidate resume sections.', requirement_text: requirements[2].text, requirement_category: requirements[2].category, requirement_priority: requirements[2].priority },
    { id: '00000000-0000-4000-8000-000000000604', candidate_id: c1Id, requirement_id: requirements[3].id, status: 'SUPPORTED', evidence_text: 'Dockerized microservices and deployed containers to AWS ECS and Fargate.', source_location: 'Skills & Work Experience', confidence: 0.85, validation_question: 'Tell us about your container orchestration experience with AWS ECS.', ai_reasoning: 'Direct explicit evidence found in candidate resume sections.', requirement_text: requirements[3].text, requirement_category: requirements[3].category, requirement_priority: requirements[3].priority },
    { id: '00000000-0000-4000-8000-000000000605', candidate_id: c1Id, requirement_id: requirements[4].id, status: 'SUPPORTED', evidence_text: 'Developed RESTful services and public developer APIs for 3 years at Nexus Media Labs.', source_location: 'Work Experience → Nexus Media', confidence: 0.90, validation_question: 'How do you handle API versioning and backward compatibility?', ai_reasoning: 'Direct explicit evidence found in candidate resume sections.', requirement_text: requirements[4].text, requirement_category: requirements[4].category, requirement_priority: requirements[4].priority },
    { id: '00000000-0000-4000-8000-000000000606', candidate_id: c1Id, requirement_id: requirements[5].id, status: 'SUPPORTED', evidence_text: 'B.S. in Computer Science, University of California, Berkeley (2018).', source_location: 'Education section', confidence: 1.0, validation_question: 'Are there theoretical concepts from your CS degree that you still leverage?', ai_reasoning: 'Direct explicit evidence found in candidate resume sections.', requirement_text: requirements[5].text, requirement_category: requirements[5].category, requirement_priority: requirements[5].priority },
    { id: '00000000-0000-4000-8000-000000000607', candidate_id: c1Id, requirement_id: requirements[6].id, status: 'SUPPORTED', evidence_text: 'Led team of 4 engineers and conducted technical code reviews.', source_location: 'Work Experience → CloudScale', confidence: 0.88, validation_question: 'How do you provide constructive feedback during code reviews?', ai_reasoning: 'Direct explicit evidence found in candidate resume sections.', requirement_text: requirements[6].text, requirement_category: requirements[6].category, requirement_priority: requirements[6].priority },
    { id: '00000000-0000-4000-8000-000000000608', candidate_id: c1Id, requirement_id: requirements[7].id, status: 'PARTIAL', evidence_text: 'Implemented automated CI/CD with GitHub Actions.', source_location: 'Work Experience → Nexus Media Labs', confidence: 0.75, validation_question: 'Can you describe your testing strategy (unit, integration, e2e) inside your CI pipeline?', ai_reasoning: 'Direct explicit evidence found in candidate resume sections.', requirement_text: requirements[7].text, requirement_category: requirements[7].category, requirement_priority: requirements[7].priority },
  ];

  const c2Skills = [
    { id: '00000000-0000-4000-8000-000000000207', candidate_id: c2Id, skill: 'React', proficiency: 'advanced', source_text: '4 years building React components', source_location: 'Skills' },
    { id: '00000000-0000-4000-8000-000000000208', candidate_id: c2Id, skill: 'TypeScript', proficiency: 'intermediate', source_text: 'Migrated JavaScript codebase to TypeScript', source_location: 'Work Experience' },
  ];

  const c2Evidence = [
    { id: '00000000-0000-4000-8000-000000000609', candidate_id: c2Id, requirement_id: requirements[0].id, status: 'PARTIAL', evidence_text: '4 years of React experience listed, 1 year below the 5-year requirement.', source_location: 'Work Experience', confidence: 0.85, validation_question: 'How comfortable are you transitioning to lead-level React responsibilities?', ai_reasoning: 'Experience duration is 4 years vs 5 years required.', requirement_text: requirements[0].text, requirement_category: requirements[0].category, requirement_priority: requirements[0].priority },
    { id: '00000000-0000-4000-8000-000000000610', candidate_id: c2Id, requirement_id: requirements[1].id, status: 'NOT_FOUND', evidence_text: '', source_location: '', confidence: 0.90, validation_question: 'Do you have hands-on experience building backend services in Node.js?', ai_reasoning: 'Resume does not mention Node.js backend development.', requirement_text: requirements[1].text, requirement_category: requirements[1].category, requirement_priority: requirements[1].priority },
  ];

  return {
    recruiters: [
      { id: recruiterId, email: 'demo@hireflow.ai', password_hash: DEMO_PASSWORD_HASH, name: 'Demo Recruiter', created_at: new Date().toISOString() },
    ],
    jobs: [
      {
        id: jobId,
        recruiter_id: recruiterId,
        title: 'Senior Full Stack Engineer (React & Node.js)',
        department: 'Engineering',
        location: 'San Francisco, CA (Hybrid)',
        description: 'We are looking for a Senior Full Stack Engineer to lead front-to-back development of our core SaaS platform. The ideal candidate will have deep mastery of modern TypeScript, React, Node.js microservices, and PostgreSQL database architecture, alongside experience deploying containerized applications to AWS.',
        raw_text: '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    requirements,
    candidates: [
      {
        id: c1Id,
        job_id: jobId,
        name: 'Alex Rivera',
        email: 'alex.rivera@example.com',
        phone: '+1 (555) 234-5678',
        file_name: 'Alex_Rivera_Senior_FullStack.pdf',
        file_type: 'pdf',
        parsed_profile: {
          summary: 'Senior Full Stack Engineer with 6 years of experience architecting distributed web applications using React, TypeScript, Node.js, and PostgreSQL in cloud environments.',
          contact: { name: 'Alex Rivera', email: 'alex.rivera@example.com', phone: '+1 (555) 234-5678', location: 'San Francisco, CA' }
        },
        created_at: new Date().toISOString(),
      },
      {
        id: c2Id,
        job_id: jobId,
        name: 'Jordan Chen',
        email: 'jordan.chen@example.com',
        phone: '+1 (555) 876-5432',
        file_name: 'Jordan_Chen_Frontend_Dev.docx',
        file_type: 'docx',
        parsed_profile: {
          summary: 'Frontend-focused software engineer with 4 years of experience building React web applications and UI component libraries.',
          contact: { name: 'Jordan Chen', email: 'jordan.chen@example.com', phone: '+1 (555) 876-5432' }
        },
        created_at: new Date().toISOString(),
      }
    ],
    candidateSkills: [...c1Skills, ...c2Skills],
    candidateExperience: [...c1Experience],
    candidateEducation: [...c1Education],
    candidateProjects: [...c1Projects],
    candidateCertifications: [],
    evidenceMappings: [...c1Evidence, ...c2Evidence],
    candidateGroups: [],
    interviewSessions: [
      {
        id: sessionId,
        candidate_id: c1Id,
        job_id: jobId,
        interviewer_notes: 'Candidate gave structured, clear answers on React concurrency and PostgreSQL query planner analysis. Confirmed 6 years of React and deep TypeScript knowledge. Provided thorough explanation of AWS ECS deployment pipeline.',
        raw_notes_text: 'React state: Used Zustand and TanStack Query. SQL: Explained EXPLAIN ANALYZE and B-Tree indexes. AWS: Managed ECS tasks via Terraform.',
        status: 'evaluated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    interviewQuestions: [
      { id: '00000000-0000-4000-8000-000000000701', session_id: sessionId, candidate_id: c1Id, category: 'technical', question: 'How do you diagnose and resolve memory leaks or slow re-renders in a large React application?', context: 'Validates deep React internals experience', priority: 1, is_answered: true },
      { id: '00000000-0000-4000-8000-000000000702', session_id: sessionId, candidate_id: c1Id, category: 'project_deep_dive', question: 'Walk us through your architecture for the Node.js microservices handling 2M requests/day at CloudScale.', context: 'Validates scalability and distributed systems background', priority: 1, is_answered: true },
      { id: '00000000-0000-4000-8000-000000000703', session_id: sessionId, candidate_id: c1Id, category: 'requirement_validation', question: 'How do you approach database migrations and indexing in PostgreSQL under zero-downtime constraints?', context: 'Validates PostgreSQL optimization requirement', priority: 2, is_answered: true },
    ],
    interviewEvidence: [],
    interviewEvaluations: [
      {
        id: '00000000-0000-4000-8000-000000000801',
        session_id: sessionId,
        summary: 'Candidate demonstrated thorough practical knowledge of React, Node.js, and PostgreSQL architecture. Responses aligned consistently with resume claims. No contradictory claims detected.',
        unanswered_areas: [],
        requirement_coverage: [
          { requirement: 'React & TypeScript', resume_status: 'SUPPORTED', interview_status: 'SUPPORTED', combined_evidence: 'Demonstrated extensive knowledge of hooks, state management, and strict TypeScript types.' },
          { requirement: 'Node.js Backend', resume_status: 'SUPPORTED', interview_status: 'SUPPORTED', combined_evidence: 'Thorough explanation of clustering, stream processing, and event loops.' },
          { requirement: 'PostgreSQL optimization', resume_status: 'SUPPORTED', interview_status: 'SUPPORTED', combined_evidence: 'Walked through index strategies and EXPLAIN plans.' }
        ],
        created_at: new Date().toISOString(),
      }
    ],
    auditLogs: [
      { id: '00000000-0000-4000-8000-000000000901', entity_type: 'job', entity_id: jobId, action: 'analyze_requirements', input_data: { title: 'Senior Full Stack Engineer' }, output_data: { count: 8 }, ai_model: 'gemini-2.0-flash', ai_prompt_summary: 'Extracted 8 explicit requirements from Job Description', source_references: [], created_at: new Date().toISOString() },
      { id: '00000000-0000-4000-8000-000000000902', entity_type: 'candidate', entity_id: c1Id, action: 'parse_resume', input_data: { file: 'Alex_Rivera_Senior_FullStack.pdf' }, output_data: { name: 'Alex Rivera', skills: 6 }, ai_model: 'gemini-2.0-flash', ai_prompt_summary: 'Parsed PDF resume for Alex Rivera', source_references: [], created_at: new Date().toISOString() },
      { id: '00000000-0000-4000-8000-000000000903', entity_type: 'candidate', entity_id: c1Id, action: 'map_evidence', input_data: { candidate_id: c1Id }, output_data: { supported: 7, partial: 1 }, ai_model: 'gemini-2.0-flash', ai_prompt_summary: 'Mapped 8 job requirements to resume evidence', source_references: [], created_at: new Date().toISOString() },
      { id: '00000000-0000-4000-8000-000000000904', entity_type: 'interview', entity_id: sessionId, action: 'generate_questions', input_data: { session_id: sessionId }, output_data: { questions_count: 3 }, ai_model: 'gemini-2.0-flash', ai_prompt_summary: 'Generated 3 targeted technical and validation interview questions', source_references: [], created_at: new Date().toISOString() },
      { id: '00000000-0000-4000-8000-000000000905', entity_type: 'interview', entity_id: sessionId, action: 'analyze_interview', input_data: { session_id: sessionId }, output_data: { evaluated: true }, ai_model: 'gemini-2.0-flash', ai_prompt_summary: 'Analyzed interview notes against job requirements', source_references: [], created_at: new Date().toISOString() },
    ]
  };
}

export const demoStore: DemoStore = createInitialDemoStore();

export function handleDemoQuery(sql: string, params: any[] = []): { rows: any[]; rowCount: number } {
  const norm = sql.trim().toLowerCase();

  // 1. SELECT 1 (health check)
  if (norm === 'select 1') {
    return { rows: [{ '?column?': 1 }], rowCount: 1 };
  }

  // 2. Recruiters
  if (norm.includes('from recruiters') && norm.includes('email = $1')) {
    const matched = demoStore.recruiters.filter(r => r.email === params[0]);
    return { rows: matched, rowCount: matched.length };
  }
  if (norm.includes('from recruiters') && norm.includes('id = $1')) {
    const matched = demoStore.recruiters.filter(r => r.id === params[0]);
    return { rows: matched, rowCount: matched.length };
  }

  // 3. Dashboard counts
  if (norm.includes('select count(*) as count from jobs')) {
    const count = demoStore.jobs.filter(j => j.status === 'active').length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }
  if (norm.includes('select count(*) as count from candidates c')) {
    return { rows: [{ count: demoStore.candidates.length.toString() }], rowCount: 1 };
  }
  if (norm.includes('select count(*) as count from interview_sessions i')) {
    const count = demoStore.interviewSessions.filter(i => ['completed', 'evaluated'].includes(i.status)).length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }
  if (norm.includes('select count(distinct em.candidate_id) as count')) {
    return { rows: [{ count: '1' }], rowCount: 1 };
  }

  // 4. Jobs
  if (norm.includes('from jobs j') && norm.includes('order by j.created_at desc limit 5')) {
    const rows = demoStore.jobs.map(j => ({
      ...j,
      candidate_count: demoStore.candidates.filter(c => c.job_id === j.id).length,
      interview_count: demoStore.interviewSessions.filter(i => i.job_id === j.id && ['completed', 'evaluated'].includes(i.status)).length,
    }));
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('from jobs j') && norm.includes('order by j.created_at desc')) {
    const rows = demoStore.jobs.map(j => ({
      ...j,
      candidate_count: demoStore.candidates.filter(c => c.job_id === j.id).length,
      interview_count: demoStore.interviewSessions.filter(i => i.job_id === j.id && ['completed', 'evaluated'].includes(i.status)).length,
    }));
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('from jobs') && norm.includes('where id = $1')) {
    const matched = demoStore.jobs.filter(j => j.id === params[0]);
    return { rows: matched, rowCount: matched.length };
  }
  if (norm.includes('insert into jobs')) {
    const newJob = {
      id: crypto.randomUUID(),
      recruiter_id: params[0],
      title: params[1],
      department: params[2] || '',
      location: params[3] || '',
      description: params[4],
      raw_text: params[4],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demoStore.jobs.unshift(newJob);
    return { rows: [newJob], rowCount: 1 };
  }

  // 5. Job Requirements
  if (norm.includes('from job_requirements') && norm.includes('job_id = $1')) {
    const rows = demoStore.requirements.filter(r => r.job_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('delete from job_requirements')) {
    demoStore.requirements = demoStore.requirements.filter(r => r.job_id !== params[0]);
    return { rows: [], rowCount: 1 };
  }
  if (norm.includes('insert into job_requirements')) {
    const newReq = {
      id: crypto.randomUUID(),
      job_id: params[0],
      category: params[1],
      text: params[2],
      priority: params[3],
      is_required: params[4],
      created_at: new Date().toISOString(),
    };
    demoStore.requirements.push(newReq);
    return { rows: [newReq], rowCount: 1 };
  }

  // 6. Candidates for Job
  if (norm.includes('from candidates c') && norm.includes('where c.job_id = $1')) {
    const jobId = params[0];
    const cands = demoStore.candidates.filter(c => c.job_id === jobId);
    const rows = cands.map(c => {
      const skills = demoStore.candidateSkills.filter(s => s.candidate_id === c.id);
      const exp = demoStore.candidateExperience.filter(e => e.candidate_id === c.id);
      const ev = demoStore.evidenceMappings.filter(e => e.candidate_id === c.id);
      const intv = demoStore.interviewSessions.find(i => i.candidate_id === c.id);

      const total = ev.length;
      const supported = ev.filter(e => e.status === 'SUPPORTED').length;
      const partial = ev.filter(e => e.status === 'PARTIAL').length;
      const not_found = ev.filter(e => e.status === 'NOT_FOUND').length;
      const unclear = ev.filter(e => e.status === 'UNCLEAR').length;

      return {
        ...c,
        skills,
        experience: exp,
        groups: [],
        interview_status: intv?.status || 'not_started',
        requirement_coverage: { total, supported, partial, not_found, unclear },
      };
    });
    return { rows, rowCount: rows.length };
  }

  // 7. Single Candidate
  if (norm.includes('from candidates') && norm.includes('where id = $1')) {
    const matched = demoStore.candidates.filter(c => c.id === params[0]);
    return { rows: matched, rowCount: matched.length };
  }
  if (norm.includes('select count(*) as count from candidates where job_id = $1')) {
    const count = demoStore.candidates.filter(c => c.job_id === params[0]).length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }
  if (norm.includes('from candidate_skills') && norm.includes('candidate_id = $1')) {
    const rows = demoStore.candidateSkills.filter(s => s.candidate_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('from candidate_experience') && norm.includes('candidate_id = $1')) {
    const rows = demoStore.candidateExperience.filter(e => e.candidate_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('from candidate_education') && norm.includes('candidate_id = $1')) {
    const rows = demoStore.candidateEducation.filter(e => e.candidate_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('from candidate_projects') && norm.includes('candidate_id = $1')) {
    const rows = demoStore.candidateProjects.filter(p => p.candidate_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('from candidate_certifications') && norm.includes('candidate_id = $1')) {
    const rows = demoStore.candidateCertifications.filter(c => c.candidate_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('from evidence_mappings') && norm.includes('candidate_id = $1')) {
    const rows = demoStore.evidenceMappings.filter(e => e.candidate_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('from candidate_groups') && norm.includes('candidate_id = $1')) {
    const rows = demoStore.candidateGroups.filter(g => g.candidate_id === params[0]);
    return { rows, rowCount: rows.length };
  }

  // 8. Interview Sessions & Questions
  if (norm.includes('from interview_sessions') && norm.includes('where id = $1')) {
    const matched = demoStore.interviewSessions.filter(i => i.id === params[0]);
    return { rows: matched, rowCount: matched.length };
  }
  if (norm.includes('from interview_sessions') && norm.includes('candidate_id = $1') && norm.includes('job_id = $2')) {
    const rows = demoStore.interviewSessions.filter(i => i.candidate_id === params[0] && i.job_id === params[1]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('from interview_sessions') && norm.includes('candidate_id = $1')) {
    const rows = demoStore.interviewSessions.filter(i => i.candidate_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('select count(*) as count from interview_sessions where job_id = $1')) {
    const count = demoStore.interviewSessions.filter(i => i.job_id === params[0] && ['completed', 'evaluated'].includes(i.status)).length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }
  if (norm.includes('from interview_questions') && norm.includes('session_id = $1')) {
    const rows = demoStore.interviewQuestions.filter(q => q.session_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('from interview_evaluations') && norm.includes('session_id = $1')) {
    const rows = demoStore.interviewEvaluations.filter(e => e.session_id === params[0]);
    return { rows, rowCount: rows.length };
  }
  if (norm.includes('update interview_sessions set interviewer_notes')) {
    const session = demoStore.interviewSessions.find(i => i.id === params[3]);
    if (session) {
      session.interviewer_notes = params[0];
      session.raw_notes_text = params[1];
      session.status = params[2];
    }
    return { rows: session ? [session] : [], rowCount: 1 };
  }

  // 9. Audit Logs
  if (norm.includes('from audit_log')) {
    return { rows: demoStore.auditLogs, rowCount: demoStore.auditLogs.length };
  }
  if (norm.includes('insert into audit_log')) {
    const newLog = {
      id: crypto.randomUUID(),
      entity_type: params[0],
      entity_id: params[1],
      action: params[2],
      input_data: typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3],
      output_data: typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4],
      ai_model: params[5],
      ai_prompt_summary: params[6],
      source_references: typeof params[7] === 'string' ? JSON.parse(params[7]) : params[7] || [],
      created_at: new Date().toISOString(),
    };
    demoStore.auditLogs.unshift(newLog);
    return { rows: [newLog], rowCount: 1 };
  }

  // Default fallback for unhandled queries
  return { rows: [], rowCount: 0 };
}
