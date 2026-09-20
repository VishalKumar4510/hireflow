import { query } from '../database/connection';
import { getAIProvider, isAIAvailable } from '../ai/provider';
import { PROMPTS, fillPrompt } from '../ai/prompts';
import { extractDocument } from '../document-processing/extractor';
import { auditService } from './audit.service';
import fs from 'fs';

export class CandidateService {
  async uploadAndProcess(jobId: string, files: Express.Multer.File[]) {
    const candidates = [];
    const errors: { file_name: string; error: string }[] = [];

    for (const file of files) {
      try {
        const buffer = fs.readFileSync(file.path);
        const doc = await extractDocument(buffer, file.originalname, file.mimetype);

        // Parse with AI
        let parsedProfile: Record<string, unknown> = {};
        if (isAIAvailable()) {
          const ai = getAIProvider();
          const prompt = fillPrompt(PROMPTS.PARSE_RESUME, { resumeText: doc.text });
          parsedProfile = await ai.generateJSON<Record<string, unknown>>(prompt);
        }

        const contact = (parsedProfile.contact || {}) as Record<string, string>;

        // Insert candidate
        const result = await query(
          `INSERT INTO candidates (job_id, name, email, phone, raw_text, file_name, file_type, parsed_profile)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            jobId,
            contact.name || file.originalname.replace(/\.[^.]+$/, ''),
            contact.email || '',
            contact.phone || '',
            doc.text,
            file.originalname,
            file.mimetype,
            JSON.stringify(parsedProfile),
          ]
        );

        const candidate = result.rows[0];

        // Insert parsed data
        await this.insertParsedData(candidate.id, parsedProfile);

        // Generate embeddings for chunks
        if (isAIAvailable()) {
          try {
            const ai = getAIProvider();
            for (const chunk of doc.chunks) {
              try {
                const embedding = await ai.generateEmbedding(chunk.text);
                await query(
                  `INSERT INTO embeddings (source_type, source_id, chunk_text, embedding, metadata)
                   VALUES ('candidate', $1, $2, $3, $4)`,
                  [candidate.id, chunk.text, JSON.stringify(embedding), JSON.stringify(chunk.metadata)]
                );
              } catch {
                // Non-fatal: embedding generation failure for one chunk
              }
            }
          } catch {
            console.warn(`Could not generate embeddings for ${file.originalname}`);
          }
        }

        // Audit
        await auditService.log({
          entity_type: 'candidate',
          entity_id: candidate.id,
          action: 'parse_resume',
          input_data: { file_name: file.originalname, text_length: doc.text.length },
          output_data: { parsed_fields: Object.keys(parsedProfile) },
          ai_model: isAIAvailable() ? getAIProvider().getModelName() : 'none',
          ai_prompt_summary: 'Parse resume text into structured profile',
          source_references: [{ type: 'resume', id: candidate.id, location: 'Full resume', snippet: doc.text.substring(0, 200) }],
        });

        candidates.push(candidate);
      } catch (error) {
        errors.push({ file_name: file.originalname, error: (error as Error).message });
      }
    }

    return { candidates, errors };
  }

  private async insertParsedData(candidateId: string, profile: Record<string, unknown>) {
    // Skills
    const skills = (profile.skills || []) as Array<Record<string, string>>;
    for (const skill of skills) {
      await query(
        `INSERT INTO candidate_skills (candidate_id, skill, proficiency, source_text, source_location)
         VALUES ($1, $2, $3, $4, $5)`,
        [candidateId, skill.skill, skill.proficiency || 'mentioned', skill.source_text || '', skill.source_location || '']
      );
    }

    // Experience
    const experience = (profile.experience || []) as Array<Record<string, string>>;
    for (const exp of experience) {
      await query(
        `INSERT INTO candidate_experience (candidate_id, title, company, duration, description, source_text)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [candidateId, exp.title || '', exp.company || '', exp.duration || '', exp.description || '', exp.source_text || '']
      );
    }

    // Education
    const education = (profile.education || []) as Array<Record<string, string>>;
    for (const edu of education) {
      await query(
        `INSERT INTO candidate_education (candidate_id, degree, institution, year, field, source_text)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [candidateId, edu.degree || '', edu.institution || '', edu.year || '', edu.field || '', edu.source_text || '']
      );
    }

    // Projects
    const projects = (profile.projects || []) as Array<Record<string, unknown>>;
    for (const proj of projects) {
      await query(
        `INSERT INTO candidate_projects (candidate_id, name, description, technologies, source_text)
         VALUES ($1, $2, $3, $4, $5)`,
        [candidateId, proj.name || '', proj.description || '', (proj.technologies as string[]) || [], proj.source_text || '']
      );
    }

    // Certifications
    const certifications = (profile.certifications || []) as Array<Record<string, string>>;
    for (const cert of certifications) {
      await query(
        `INSERT INTO candidate_certifications (candidate_id, name, issuer, year, source_text)
         VALUES ($1, $2, $3, $4, $5)`,
        [candidateId, cert.name || '', cert.issuer || '', cert.year || '', cert.source_text || '']
      );
    }
  }

  async mapEvidence(candidateId: string, jobId: string) {
    const candidate = await this.getCandidate(candidateId);
    const reqResult = await query('SELECT * FROM job_requirements WHERE job_id = $1', [jobId]);

    if (!isAIAvailable()) {
      throw Object.assign(new Error('AI provider not available'), { statusCode: 503 });
    }

    const ai = getAIProvider();
    const prompt = fillPrompt(PROMPTS.MAP_EVIDENCE, {
      requirements: JSON.stringify(reqResult.rows),
      candidateProfile: JSON.stringify(candidate.parsed_profile),
      resumeText: candidate.raw_text,
    });

    const response = await ai.generateJSON<{ mappings: Array<{
      requirement_id: string; status: string; evidence_text: string;
      source_location: string; confidence: number; validation_question: string;
      ai_reasoning: string;
    }> }>(prompt);

    // Delete existing mappings
    await query('DELETE FROM evidence_mappings WHERE candidate_id = $1', [candidateId]);

    const mappings = [];
    for (const mapping of response.mappings) {
      const result = await query(
        `INSERT INTO evidence_mappings (candidate_id, requirement_id, status, evidence_text, source_location, confidence, validation_question, ai_reasoning)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [candidateId, mapping.requirement_id, mapping.status, mapping.evidence_text, mapping.source_location, mapping.confidence, mapping.validation_question, mapping.ai_reasoning]
      );
      mappings.push(result.rows[0]);
    }

    // Audit
    await auditService.log({
      entity_type: 'candidate',
      entity_id: candidateId,
      action: 'map_evidence',
      input_data: { requirement_count: reqResult.rows.length },
      output_data: { mapping_count: mappings.length, statuses: mappings.map(m => m.status) },
      ai_model: ai.getModelName(),
      ai_prompt_summary: 'Map candidate evidence against job requirements',
      source_references: [
        { type: 'resume', id: candidateId, location: 'Full resume', snippet: candidate.raw_text.substring(0, 200) },
      ],
    });

    return mappings;
  }

  async generateSummary(candidateId: string, jobId: string) {
    const candidate = await this.getCandidate(candidateId);
    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    const reqResult = await query('SELECT * FROM job_requirements WHERE job_id = $1', [jobId]);
    const evidenceResult = await query('SELECT * FROM evidence_mappings WHERE candidate_id = $1', [candidateId]);

    if (!isAIAvailable()) {
      throw Object.assign(new Error('AI provider not available'), { statusCode: 503 });
    }

    const ai = getAIProvider();
    const prompt = fillPrompt(PROMPTS.GENERATE_SUMMARY, {
      jobTitle: jobResult.rows[0]?.title || '',
      requirements: JSON.stringify(reqResult.rows),
      candidateProfile: JSON.stringify(candidate.parsed_profile),
      evidenceMappings: JSON.stringify(evidenceResult.rows),
    });

    const summary = await ai.generateJSON<Record<string, unknown>>(prompt);

    await auditService.log({
      entity_type: 'candidate',
      entity_id: candidateId,
      action: 'generate_summary',
      input_data: { job_id: jobId },
      output_data: summary,
      ai_model: ai.getModelName(),
      ai_prompt_summary: 'Generate structured candidate summary',
      source_references: [],
    });

    return summary;
  }

  async groupCandidates(jobId: string) {
    const candidates = await this.getCandidatesForJob(jobId);
    const reqResult = await query('SELECT * FROM job_requirements WHERE job_id = $1', [jobId]);
    const jobResult = await query('SELECT title FROM jobs WHERE id = $1', [jobId]);

    if (!isAIAvailable() || candidates.length === 0) {
      return [];
    }

    const ai = getAIProvider();
    const candidateSummaries = candidates.map((c: any) => ({
      id: c.id,
      name: c.name,
      skills: c.skills,
      experience: c.experience,
      parsed_profile: c.parsed_profile,
    }));

    const prompt = fillPrompt(PROMPTS.GROUP_CANDIDATES, {
      jobTitle: jobResult.rows[0]?.title || '',
      requirements: JSON.stringify(reqResult.rows),
      candidates: JSON.stringify(candidateSummaries),
    });

    const response = await ai.generateJSON<{ groupings: Array<{
      candidate_id: string; groups: Array<{ group_name: string; reasoning: string }>;
    }> }>(prompt);

    // Delete existing groups for this job's candidates
    for (const candidate of candidates) {
      await query('DELETE FROM candidate_groups WHERE candidate_id = $1', [candidate.id]);
    }

    for (const grouping of response.groupings) {
      for (const group of grouping.groups) {
        await query(
          'INSERT INTO candidate_groups (candidate_id, group_name, reasoning) VALUES ($1, $2, $3)',
          [grouping.candidate_id, group.group_name, group.reasoning]
        );
      }
    }

    return response.groupings;
  }

  async getCandidate(candidateId: string) {
    const result = await query('SELECT * FROM candidates WHERE id = $1', [candidateId]);
    if (result.rows.length === 0) {
      throw Object.assign(new Error('Candidate not found'), { statusCode: 404 });
    }

    const candidate = result.rows[0];

    // Get related data
    const [skills, experience, education, projects, certifications, evidence, groups, interviews] = await Promise.all([
      query('SELECT * FROM candidate_skills WHERE candidate_id = $1', [candidateId]),
      query('SELECT * FROM candidate_experience WHERE candidate_id = $1', [candidateId]),
      query('SELECT * FROM candidate_education WHERE candidate_id = $1', [candidateId]),
      query('SELECT * FROM candidate_projects WHERE candidate_id = $1', [candidateId]),
      query('SELECT * FROM candidate_certifications WHERE candidate_id = $1', [candidateId]),
      query(
        `SELECT em.*, jr.text as requirement_text, jr.category as requirement_category, jr.priority as requirement_priority
         FROM evidence_mappings em
         JOIN job_requirements jr ON em.requirement_id = jr.id
         WHERE em.candidate_id = $1
         ORDER BY jr.category`,
        [candidateId]
      ),
      query('SELECT * FROM candidate_groups WHERE candidate_id = $1', [candidateId]),
      query('SELECT * FROM interview_sessions WHERE candidate_id = $1 ORDER BY created_at DESC LIMIT 1', [candidateId]),
    ]);

    candidate.skills = skills.rows;
    candidate.experience = experience.rows;
    candidate.education = education.rows;
    candidate.projects = projects.rows;
    candidate.certifications = certifications.rows;
    candidate.evidence_mappings = evidence.rows;
    candidate.groups = groups.rows;
    candidate.interview_status = interviews.rows[0]?.status || 'not_started';

    // Calculate requirement coverage
    const totalMappings = evidence.rows.length;
    if (totalMappings > 0) {
      candidate.requirement_coverage = {
        total: totalMappings,
        supported: evidence.rows.filter((e: { status: string }) => e.status === 'SUPPORTED').length,
        partial: evidence.rows.filter((e: { status: string }) => e.status === 'PARTIAL').length,
        not_found: evidence.rows.filter((e: { status: string }) => e.status === 'NOT_FOUND').length,
        unclear: evidence.rows.filter((e: { status: string }) => e.status === 'UNCLEAR').length,
        coverage_percentage: Math.round(
          (evidence.rows.filter((e: { status: string }) => e.status === 'SUPPORTED' || e.status === 'PARTIAL').length / totalMappings) * 100
        ),
      };
    }

    return candidate;
  }

  async getCandidatesForJob(jobId: string) {
    const result = await query(
      `SELECT c.*,
        (SELECT json_agg(cs) FROM candidate_skills cs WHERE cs.candidate_id = c.id) as skills,
        (SELECT json_agg(ce) FROM candidate_experience ce WHERE ce.candidate_id = c.id) as experience,
        (SELECT json_agg(cg) FROM candidate_groups cg WHERE cg.candidate_id = c.id) as groups,
        (SELECT status FROM interview_sessions WHERE candidate_id = c.id ORDER BY created_at DESC LIMIT 1) as interview_status,
        (SELECT json_build_object(
          'total', COUNT(*),
          'supported', COUNT(*) FILTER (WHERE em.status = 'SUPPORTED'),
          'partial', COUNT(*) FILTER (WHERE em.status = 'PARTIAL'),
          'not_found', COUNT(*) FILTER (WHERE em.status = 'NOT_FOUND'),
          'unclear', COUNT(*) FILTER (WHERE em.status = 'UNCLEAR')
        ) FROM evidence_mappings em WHERE em.candidate_id = c.id) as requirement_coverage
       FROM candidates c
       WHERE c.job_id = $1
       ORDER BY c.created_at DESC`,
      [jobId]
    );
    return result.rows;
  }
}

export const candidateService = new CandidateService();
