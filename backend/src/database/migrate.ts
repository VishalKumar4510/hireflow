import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { initDatabase, closeDatabase, query } from './connection';
import { DEMO_RECRUITER_ID } from './demo-store';
import bcrypt from 'bcryptjs';

async function migrate() {
  console.log('🔄 Running HireFlow database migration...');

  try {
    await initDatabase();
    console.log('✅ Migration complete');

    // Seed demo account if DEMO_MODE
    if (process.env.DEMO_MODE === 'true') {
      await seedDemoData();
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

async function seedDemoData() {
  console.log('🌱 Seeding demo data...');

  // Check if demo user exists
  let recruiterId: string;
  const existing = await query('SELECT id FROM recruiters WHERE email = $1', ['demo@hireflow.ai']);
  if (existing.rows.length > 0) {
    recruiterId = existing.rows[0].id;
    console.log('   Demo recruiter already exists:', recruiterId);
    if (recruiterId !== DEMO_RECRUITER_ID) {
      try {
        await query(`
          ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_recruiter_id_fkey;
          ALTER TABLE jobs ADD CONSTRAINT jobs_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        await query(`UPDATE recruiters SET id = $1 WHERE email = $2`, [DEMO_RECRUITER_ID, 'demo@hireflow.ai']);
        recruiterId = DEMO_RECRUITER_ID;
        console.log('   Updated demo recruiter ID to canonical UUID:', DEMO_RECRUITER_ID);
      } catch (updateErr) {
        console.warn('   Could not update recruiter ID to canonical UUID, using existing:', (updateErr as Error).message);
      }
    }
  } else {
    const passwordHash = await bcrypt.hash('demo123', 12);
    const result = await query(
      `INSERT INTO recruiters (id, email, password_hash, name)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [DEMO_RECRUITER_ID, 'demo@hireflow.ai', passwordHash, 'Demo Recruiter']
    );
    recruiterId = result.rows[0].id;
    console.log('✅ Demo user created: demo@hireflow.ai / demo123 (ID: ' + recruiterId + ')');
  }

  // Check if demo job exists
  const existingJob = await query('SELECT id FROM jobs WHERE recruiter_id = $1 AND title = $2', [
    recruiterId,
    'Senior Full Stack Engineer (React & Node.js)'
  ]);

  if (existingJob.rows.length > 0) {
    console.log('   Demo job already exists');
    return;
  }

  // 1. Create Demo Job
  const jobRes = await query(
    `INSERT INTO jobs (id, recruiter_id, title, department, location, description, status)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'active') RETURNING id`,
    [
      recruiterId,
      'Senior Full Stack Engineer (React & Node.js)',
      'Engineering',
      'San Francisco, CA (Hybrid)',
      'We are looking for a Senior Full Stack Engineer to lead front-to-back development of our core SaaS platform. The ideal candidate will have deep mastery of modern TypeScript, React, Node.js microservices, and PostgreSQL database architecture, alongside experience deploying containerized applications to AWS.'
    ]
  );
  const jobId = jobRes.rows[0].id;
  console.log('✅ Demo job created:', jobId);

  // 2. Create Job Requirements
  const reqData = [
    { cat: 'technical_skill', text: '5+ years experience with React and TypeScript', pri: 'required', req: true },
    { cat: 'technical_skill', text: 'Strong backend proficiency with Node.js and Express', pri: 'required', req: true },
    { cat: 'technical_skill', text: 'Relational database design and query optimization with PostgreSQL', pri: 'required', req: true },
    { cat: 'technical_skill', text: 'Experience with Docker and AWS container deployment (ECS/EKS)', pri: 'preferred', req: false },
    { cat: 'experience', text: 'Experience designing and maintaining public or internal RESTful APIs', pri: 'required', req: true },
    { cat: 'education', text: 'Bachelor’s degree in Computer Science or equivalent practical experience', pri: 'preferred', req: false },
    { cat: 'soft_skill', text: 'Proven ability to mentor junior engineers and conduct technical reviews', pri: 'preferred', req: false },
    { cat: 'domain_knowledge', text: 'Understanding of modern CI/CD pipelines and automated testing suites', pri: 'nice_to_have', req: false },
  ];

  const reqIds: string[] = [];
  for (const r of reqData) {
    const res = await query(
      `INSERT INTO job_requirements (id, job_id, category, text, priority, is_required)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5) RETURNING id`,
      [jobId, r.cat, r.text, r.pri, r.req]
    );
    reqIds.push(res.rows[0].id);
  }
  console.log(`✅ Created ${reqIds.length} job requirements`);

  // 3. Create Candidate 1: Alex Rivera (Strong Match)
  const c1 = await query(
    `INSERT INTO candidates (id, job_id, name, email, phone, file_name, file_type, parsed_profile)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      jobId,
      'Alex Rivera',
      'alex.rivera@example.com',
      '+1 (555) 234-5678',
      'Alex_Rivera_Senior_FullStack.pdf',
      'pdf',
      JSON.stringify({
        summary: 'Senior Full Stack Engineer with 6 years of experience architecting distributed web applications using React, TypeScript, Node.js, and PostgreSQL in cloud environments.',
        contact: { name: 'Alex Rivera', email: 'alex.rivera@example.com', phone: '+1 (555) 234-5678', location: 'San Francisco, CA' }
      })
    ]
  );
  const c1Id = c1.rows[0].id;

  // Candidate 1 Skills
  const c1Skills = [
    { skill: 'React', prof: 'expert', text: 'Lead React architect for 4+ years', loc: 'Skills' },
    { skill: 'TypeScript', prof: 'expert', text: 'Production TypeScript across frontend & backend', loc: 'Skills' },
    { skill: 'Node.js', prof: 'advanced', text: 'Built Node.js microservices handling 2M req/day', loc: 'Work Experience' },
    { skill: 'PostgreSQL', prof: 'advanced', text: 'Optimized complex SQL queries and schema indexing', loc: 'Work Experience' },
    { skill: 'Docker', prof: 'intermediate', text: 'Dockerized microservices and configured docker-compose', loc: 'Work Experience' },
    { skill: 'AWS', prof: 'intermediate', text: 'Deployed containers to AWS ECS and Fargate', loc: 'Work Experience' }
  ];
  for (const s of c1Skills) {
    await query(
      `INSERT INTO candidate_skills (id, candidate_id, skill, proficiency, source_text, source_location)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)`,
      [c1Id, s.skill, s.prof, s.text, s.loc]
    );
  }

  // Candidate 1 Experience
  await query(
    `INSERT INTO candidate_experience (id, candidate_id, title, company, duration, description)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)`,
    [c1Id, 'Senior Software Engineer', 'CloudScale Technologies', '2021 - Present (3 yrs)', 'Architected customer-facing dashboard in React and TypeScript with Node.js backend. Led team of 4 engineers and improved response latency by 40%.']
  );
  await query(
    `INSERT INTO candidate_experience (id, candidate_id, title, company, duration, description)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)`,
    [c1Id, 'Full Stack Developer', 'Nexus Media Labs', '2018 - 2021 (3 yrs)', 'Developed RESTful services and relational schemas with PostgreSQL and Express. Implemented automated CI/CD with GitHub Actions.']
  );

  // Candidate 1 Education
  await query(
    `INSERT INTO candidate_education (id, candidate_id, degree, institution, year, field)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)`,
    [c1Id, 'B.S. in Computer Science', 'University of California, Berkeley', '2018', 'Computer Science']
  );

  // Candidate 1 Evidence Mappings
  const evidenceData = [
    { reqIdx: 0, st: 'SUPPORTED', ev: '6 years of experience using React and TypeScript across CloudScale and Nexus Media.', loc: 'Work Experience & Summary', conf: 0.95, q: 'Can you discuss how you structured React state management in your largest project?' },
    { reqIdx: 1, st: 'SUPPORTED', ev: 'Built Node.js microservices handling 2M req/day at CloudScale Technologies.', loc: 'Work Experience → CloudScale', conf: 0.92, q: 'What patterns do you use for error handling and logging across Node.js services?' },
    { reqIdx: 2, st: 'SUPPORTED', ev: 'Optimized complex SQL queries and schema indexing in PostgreSQL at Nexus Media Labs.', loc: 'Work Experience → Nexus Media', conf: 0.90, q: 'How do you approach indexing and query performance analysis in PostgreSQL?' },
    { reqIdx: 3, st: 'SUPPORTED', ev: 'Dockerized microservices and deployed containers to AWS ECS and Fargate.', loc: 'Skills & Work Experience', conf: 0.85, q: 'Tell us about your container orchestration experience with AWS ECS.' },
    { reqIdx: 4, st: 'SUPPORTED', ev: 'Developed RESTful services and public developer APIs for 3 years at Nexus Media Labs.', loc: 'Work Experience → Nexus Media', conf: 0.90, q: 'How do you handle API versioning and backward compatibility?' },
    { reqIdx: 5, st: 'SUPPORTED', ev: 'B.S. in Computer Science, University of California, Berkeley (2018).', loc: 'Education section', conf: 1.0, q: 'Are there theoretical concepts from your CS degree that you still leverage?' },
    { reqIdx: 6, st: 'SUPPORTED', ev: 'Led team of 4 engineers and conducted technical code reviews.', loc: 'Work Experience → CloudScale', conf: 0.88, q: 'How do you provide constructive feedback during code reviews?' },
    { reqIdx: 7, st: 'PARTIAL', ev: 'Implemented automated CI/CD with GitHub Actions.', loc: 'Work Experience → Nexus Media Labs', conf: 0.75, q: 'Can you describe your testing strategy (unit, integration, e2e) inside your CI pipeline?' }
  ];

  for (const e of evidenceData) {
    await query(
      `INSERT INTO evidence_mappings (id, candidate_id, requirement_id, status, evidence_text, source_location, confidence, validation_question, ai_reasoning)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8)`,
      [c1Id, reqIds[e.reqIdx], e.st, e.ev, e.loc, e.conf, e.q, 'Direct explicit evidence found in candidate resume sections.']
    );
  }

  // 4. Create Interview Session for Alex Rivera
  const sessionRes = await query(
    `INSERT INTO interview_sessions (id, candidate_id, job_id, interviewer_notes, raw_notes_text, status)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'evaluated') RETURNING id`,
    [
      c1Id,
      jobId,
      'Candidate gave structured, clear answers on React concurrency and PostgreSQL query planner analysis. Confirmed 6 years of React and deep TypeScript knowledge. Provided thorough explanation of AWS ECS deployment pipeline.',
      'React state: Used Zustand and TanStack Query. SQL: Explained EXPLAIN ANALYZE and B-Tree indexes. AWS: Managed ECS tasks via Terraform.',
    ]
  );
  const sessionId = sessionRes.rows[0].id;

  // Interview Questions
  const questions = [
    { cat: 'technical', q: 'How do you diagnose and resolve memory leaks or slow re-renders in a large React application?', ctx: 'Validates deep React internals experience', pri: 1 },
    { cat: 'project_deep_dive', q: 'Walk us through your architecture for the Node.js microservices handling 2M requests/day at CloudScale.', ctx: 'Validates scalability and distributed systems background', pri: 1 },
    { cat: 'requirement_validation', q: 'How do you approach database migrations and indexing in PostgreSQL under zero-downtime constraints?', ctx: 'Validates PostgreSQL optimization requirement', pri: 2 },
  ];
  for (const q of questions) {
    await query(
      `INSERT INTO interview_questions (id, session_id, candidate_id, category, question, context, priority, is_answered)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, true)`,
      [sessionId, c1Id, q.cat, q.q, q.ctx, q.pri]
    );
  }

  // Interview Evaluation
  await query(
    `INSERT INTO interview_evaluations (id, session_id, summary, unanswered_areas, requirement_coverage)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
    [
      sessionId,
      'Candidate demonstrated thorough practical knowledge of React, Node.js, and PostgreSQL architecture. Responses aligned consistently with resume claims. No contradictory claims detected.',
      JSON.stringify([]),
      JSON.stringify([
        { requirement: 'React & TypeScript', resume_status: 'SUPPORTED', interview_status: 'SUPPORTED', combined_evidence: 'Demonstrated extensive knowledge of hooks, state management, and strict TypeScript types.' },
        { requirement: 'Node.js Backend', resume_status: 'SUPPORTED', interview_status: 'SUPPORTED', combined_evidence: 'Thorough explanation of clustering, stream processing, and event loops.' },
        { requirement: 'PostgreSQL optimization', resume_status: 'SUPPORTED', interview_status: 'SUPPORTED', combined_evidence: 'Walked through index strategies and EXPLAIN plans.' }
      ])
    ]
  );

  // 5. Create Candidate 2: Jordan Chen (Partial Match)
  const c2 = await query(
    `INSERT INTO candidates (id, job_id, name, email, phone, file_name, file_type, parsed_profile)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      jobId,
      'Jordan Chen',
      'jordan.chen@example.com',
      '+1 (555) 876-5432',
      'Jordan_Chen_Frontend_Dev.docx',
      'docx',
      JSON.stringify({
        summary: 'Frontend-focused software engineer with 4 years of experience building React web applications and UI component libraries.',
        contact: { name: 'Jordan Chen', email: 'jordan.chen@example.com', phone: '+1 (555) 876-5432' }
      })
    ]
  );
  const c2Id = c2.rows[0].id;
  await query(
    `INSERT INTO candidate_skills (id, candidate_id, skill, proficiency, source_text, source_location)
     VALUES (uuid_generate_v4(), $1, 'React', 'advanced', '4 years building React components', 'Skills')`,
    [c2Id]
  );
  await query(
    `INSERT INTO candidate_skills (id, candidate_id, skill, proficiency, source_text, source_location)
     VALUES (uuid_generate_v4(), $1, 'TypeScript', 'intermediate', 'Migrated JavaScript codebase to TypeScript', 'Work Experience')`,
    [c2Id]
  );

  // Candidate 2 Evidence (Partial / Not Found)
  await query(
    `INSERT INTO evidence_mappings (id, candidate_id, requirement_id, status, evidence_text, source_location, confidence, validation_question, ai_reasoning)
     VALUES (uuid_generate_v4(), $1, $2, 'PARTIAL', '4 years of React experience listed, 1 year below the 5-year requirement.', 'Work Experience', 0.85, 'How comfortable are you transitioning to lead-level React responsibilities?', 'Experience duration is 4 years vs 5 years required.')`,
    [c2Id, reqIds[0]]
  );
  await query(
    `INSERT INTO evidence_mappings (id, candidate_id, requirement_id, status, evidence_text, source_location, confidence, validation_question, ai_reasoning)
     VALUES (uuid_generate_v4(), $1, $2, 'NOT_FOUND', '', '', 0.90, 'Do you have hands-on experience building backend services in Node.js?', 'Resume does not mention Node.js backend development.')`,
    [c2Id, reqIds[1]]
  );

  // 6. Seed Audit Logs
  const auditActions = [
    { type: 'job', id: jobId, act: 'analyze_requirements', prompt: 'Extracted 8 explicit requirements from Job Description', in: { title: 'Senior Full Stack Engineer' }, out: { count: 8 } },
    { type: 'candidate', id: c1Id, act: 'parse_resume', prompt: 'Parsed PDF resume for Alex Rivera', in: { file: 'Alex_Rivera_Senior_FullStack.pdf' }, out: { name: 'Alex Rivera', skills: 6 } },
    { type: 'candidate', id: c1Id, act: 'map_evidence', prompt: 'Mapped 8 job requirements to resume evidence', in: { candidate_id: c1Id }, out: { supported: 7, partial: 1 } },
    { type: 'interview', id: sessionId, act: 'generate_questions', prompt: 'Generated 3 targeted technical and validation interview questions', in: { session_id: sessionId }, out: { questions_count: 3 } },
    { type: 'interview', id: sessionId, act: 'analyze_interview', prompt: 'Analyzed interview notes against job requirements', in: { session_id: sessionId }, out: { evaluated: true } }
  ];

  for (const a of auditActions) {
    await query(
      `INSERT INTO audit_log (id, entity_type, entity_id, action, input_data, output_data, ai_model, ai_prompt_summary)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'gemini-2.0-flash', $6)`,
      [a.type, a.id, a.act, JSON.stringify(a.in), JSON.stringify(a.out), a.prompt]
    );
  }

  console.log('✅ Full demo dataset seeded: 1 job, 8 requirements, 2 candidates, evidence maps, interview, and audit trail!');
}

migrate();
