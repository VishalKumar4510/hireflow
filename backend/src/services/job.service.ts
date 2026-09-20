import { query } from '../database/connection';
import { getAIProvider, isAIAvailable } from '../ai/provider';
import { PROMPTS, fillPrompt } from '../ai/prompts';
import { auditService } from './audit.service';

export class JobService {
  async createJob(recruiterId: string, data: { title: string; department: string; location: string; description: string }) {
    const result = await query(
      `INSERT INTO jobs (recruiter_id, title, department, location, description, raw_text, status)
       VALUES ($1, $2, $3, $4, $5, $5, 'active')
       RETURNING *`,
      [recruiterId, data.title, data.department, data.location, data.description]
    );
    return result.rows[0];
  }

  async analyzeJob(jobId: string) {
    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      throw Object.assign(new Error('Job not found'), { statusCode: 404 });
    }

    const job = jobResult.rows[0];

    if (!isAIAvailable()) {
      throw Object.assign(new Error('AI provider not available. Set GEMINI_API_KEY.'), { statusCode: 503 });
    }

    const ai = getAIProvider();
    const prompt = fillPrompt(PROMPTS.EXTRACT_JOB_REQUIREMENTS, {
      jobDescription: job.description,
    });

    const response = await ai.generateJSON<{ requirements: Array<{
      category: string; text: string; priority: string; is_required: boolean;
    }> }>(prompt);

    // Delete existing requirements and insert new ones
    await query('DELETE FROM job_requirements WHERE job_id = $1', [jobId]);

    const requirements = [];
    for (const req of response.requirements) {
      const result = await query(
        `INSERT INTO job_requirements (job_id, category, text, priority, is_required)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [jobId, req.category, req.text, req.priority, req.is_required]
      );
      requirements.push(result.rows[0]);
    }

    // Audit log
    await auditService.log({
      entity_type: 'job',
      entity_id: jobId,
      action: 'analyze_requirements',
      input_data: { description_length: job.description.length },
      output_data: { requirement_count: requirements.length },
      ai_model: ai.getModelName(),
      ai_prompt_summary: 'Extract structured requirements from job description',
      source_references: [{ type: 'job_description', id: jobId, location: 'Full description', snippet: job.description.substring(0, 200) }],
    });

    return { job_id: jobId, requirements };
  }

  async getJob(jobId: string) {
    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      throw Object.assign(new Error('Job not found'), { statusCode: 404 });
    }

    const job = jobResult.rows[0];

    // Get requirements
    const reqResult = await query('SELECT * FROM job_requirements WHERE job_id = $1 ORDER BY category, priority', [jobId]);
    job.requirements = reqResult.rows;

    // Get candidate count
    const candidateCount = await query('SELECT COUNT(*) as count FROM candidates WHERE job_id = $1', [jobId]);
    job.candidate_count = parseInt(candidateCount.rows[0].count);

    // Get interview count
    const interviewCount = await query(
      "SELECT COUNT(*) as count FROM interview_sessions WHERE job_id = $1 AND status IN ('completed', 'evaluated')",
      [jobId]
    );
    job.interview_count = parseInt(interviewCount.rows[0].count);

    return job;
  }

  async getJobs(recruiterId: string) {
    const result = await query(
      `SELECT j.*,
        (SELECT COUNT(*) FROM candidates c WHERE c.job_id = j.id) as candidate_count,
        (SELECT COUNT(*) FROM interview_sessions i WHERE i.job_id = j.id AND i.status IN ('completed', 'evaluated')) as interview_count
       FROM jobs j
       WHERE j.recruiter_id = $1
       ORDER BY j.created_at DESC`,
      [recruiterId]
    );
    return result.rows;
  }

  async updateRequirements(jobId: string, requirements: Array<{ category: string; text: string; priority: string; is_required: boolean }>) {
    await query('DELETE FROM job_requirements WHERE job_id = $1', [jobId]);

    const results = [];
    for (const req of requirements) {
      const result = await query(
        `INSERT INTO job_requirements (job_id, category, text, priority, is_required)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [jobId, req.category, req.text, req.priority, req.is_required]
      );
      results.push(result.rows[0]);
    }
    return results;
  }

  async getRequirements(jobId: string) {
    const result = await query(
      'SELECT * FROM job_requirements WHERE job_id = $1 ORDER BY category, priority',
      [jobId]
    );
    return result.rows;
  }

  async deleteJob(jobId: string) {
    await query('DELETE FROM jobs WHERE id = $1', [jobId]);
  }
}

export const jobService = new JobService();
