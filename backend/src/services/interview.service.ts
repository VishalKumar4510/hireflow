import { query } from '../database/connection';
import { getAIProvider, isAIAvailable } from '../ai/provider';
import { PROMPTS, fillPrompt } from '../ai/prompts';
import { auditService } from './audit.service';

export class InterviewService {
  async createSession(candidateId: string, jobId: string) {
    const result = await query(
      `INSERT INTO interview_sessions (candidate_id, job_id, status)
       VALUES ($1, $2, 'not_started') RETURNING *`,
      [candidateId, jobId]
    );
    return result.rows[0];
  }

  async generateQuestions(sessionId: string, focusAreas?: string[]) {
    const session = await this.getSession(sessionId);

    const candidateResult = await query('SELECT * FROM candidates WHERE id = $1', [session.candidate_id]);
    const candidate = candidateResult.rows[0];

    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [session.job_id]);
    const reqResult = await query('SELECT * FROM job_requirements WHERE job_id = $1', [session.job_id]);
    const evidenceResult = await query('SELECT * FROM evidence_mappings WHERE candidate_id = $1', [session.candidate_id]);

    if (!isAIAvailable()) {
      throw Object.assign(new Error('AI provider not available'), { statusCode: 503 });
    }

    const ai = getAIProvider();
    const prompt = fillPrompt(PROMPTS.GENERATE_INTERVIEW_QUESTIONS, {
      jobTitle: jobResult.rows[0]?.title || '',
      requirements: JSON.stringify(reqResult.rows),
      candidateProfile: JSON.stringify(candidate.parsed_profile),
      evidenceMappings: JSON.stringify(evidenceResult.rows),
      focusAreas: focusAreas?.join(', ') || 'All areas',
    });

    const response = await ai.generateJSON<{ questions: Array<{
      category: string; question: string; context: string;
      requirement_id: string | null; priority: number;
    }> }>(prompt);

    // Delete existing questions for this session
    await query('DELETE FROM interview_questions WHERE session_id = $1', [sessionId]);

    const questions = [];
    for (const q of response.questions) {
      const result = await query(
        `INSERT INTO interview_questions (session_id, candidate_id, category, question, context, requirement_id, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [sessionId, session.candidate_id, q.category, q.question, q.context, q.requirement_id, q.priority]
      );
      questions.push(result.rows[0]);
    }

    // Update session status
    await query("UPDATE interview_sessions SET status = 'questions_generated', updated_at = NOW() WHERE id = $1", [sessionId]);

    await auditService.log({
      entity_type: 'interview',
      entity_id: sessionId,
      action: 'generate_questions',
      input_data: { candidate_id: session.candidate_id, focus_areas: focusAreas },
      output_data: { question_count: questions.length },
      ai_model: ai.getModelName(),
      ai_prompt_summary: 'Generate candidate-specific interview questions',
      source_references: [],
    });

    return questions;
  }

  async submitNotes(sessionId: string, notes: string) {
    await query(
      "UPDATE interview_sessions SET interviewer_notes = $2, raw_notes_text = $2, status = 'completed', updated_at = NOW() WHERE id = $1",
      [sessionId, notes]
    );

    return this.getSession(sessionId);
  }

  async analyzeInterview(sessionId: string) {
    const session = await this.getSession(sessionId);
    if (!session.interviewer_notes) {
      throw Object.assign(new Error('No interview notes to analyze'), { statusCode: 400 });
    }

    const candidateResult = await query('SELECT * FROM candidates WHERE id = $1', [session.candidate_id]);
    const candidate = candidateResult.rows[0];
    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [session.job_id]);
    const reqResult = await query('SELECT * FROM job_requirements WHERE job_id = $1', [session.job_id]);
    const existingEvidence = await query('SELECT * FROM evidence_mappings WHERE candidate_id = $1', [session.candidate_id]);

    if (!isAIAvailable()) {
      throw Object.assign(new Error('AI provider not available'), { statusCode: 503 });
    }

    const ai = getAIProvider();
    const prompt = fillPrompt(PROMPTS.ANALYZE_INTERVIEW, {
      jobTitle: jobResult.rows[0]?.title || '',
      requirements: JSON.stringify(reqResult.rows),
      candidateProfile: JSON.stringify(candidate.parsed_profile),
      existingEvidence: JSON.stringify(existingEvidence.rows),
      interviewNotes: session.interviewer_notes,
    });

    const response = await ai.generateJSON<{
      interview_evidence: Array<{
        requirement_id: string; evidence_text: string; source: string;
        status: string; notes: string;
      }>;
      unanswered_areas: Array<{
        requirement_id: string; requirement_text: string; reason: string;
        suggested_follow_up: string;
      }>;
      summary: string;
    }>(prompt);

    // Store interview evidence
    await query('DELETE FROM interview_evidence WHERE session_id = $1', [sessionId]);
    for (const evidence of response.interview_evidence) {
      await query(
        `INSERT INTO interview_evidence (session_id, requirement_id, evidence_text, source, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, evidence.requirement_id, evidence.evidence_text, evidence.source, evidence.status, evidence.notes]
      );
    }

    await auditService.log({
      entity_type: 'interview',
      entity_id: sessionId,
      action: 'analyze_interview',
      input_data: { notes_length: session.interviewer_notes.length },
      output_data: { evidence_count: response.interview_evidence.length, unanswered_count: response.unanswered_areas.length },
      ai_model: ai.getModelName(),
      ai_prompt_summary: 'Analyze interview notes and map evidence to requirements',
      source_references: [{ type: 'interview_notes', id: sessionId, location: 'Full notes', snippet: session.interviewer_notes.substring(0, 200) }],
    });

    return response;
  }

  async generateEvaluation(sessionId: string) {
    const session = await this.getSession(sessionId);
    const candidateResult = await query('SELECT * FROM candidates WHERE id = $1', [session.candidate_id]);
    const candidate = candidateResult.rows[0];
    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [session.job_id]);
    const reqResult = await query('SELECT * FROM job_requirements WHERE job_id = $1', [session.job_id]);
    const resumeEvidence = await query('SELECT * FROM evidence_mappings WHERE candidate_id = $1', [session.candidate_id]);
    const interviewEvidence = await query('SELECT * FROM interview_evidence WHERE session_id = $1', [sessionId]);

    if (!isAIAvailable()) {
      throw Object.assign(new Error('AI provider not available'), { statusCode: 503 });
    }

    const ai = getAIProvider();
    const prompt = fillPrompt(PROMPTS.GENERATE_EVALUATION, {
      jobTitle: jobResult.rows[0]?.title || '',
      requirements: JSON.stringify(reqResult.rows),
      candidateProfile: JSON.stringify(candidate.parsed_profile),
      resumeEvidence: JSON.stringify(resumeEvidence.rows),
      interviewEvidence: JSON.stringify(interviewEvidence.rows),
      unansweredAreas: '[]',
    });

    const evaluation = await ai.generateJSON<{
      summary: string;
      requirement_coverage: Array<Record<string, unknown>>;
      unanswered_areas: Array<Record<string, unknown>>;
    }>(prompt);

    // Store evaluation
    await query('DELETE FROM interview_evaluations WHERE session_id = $1', [sessionId]);
    await query(
      `INSERT INTO interview_evaluations (session_id, summary, unanswered_areas, requirement_coverage)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, evaluation.summary, JSON.stringify(evaluation.unanswered_areas), JSON.stringify(evaluation.requirement_coverage)]
    );

    await query("UPDATE interview_sessions SET status = 'evaluated', updated_at = NOW() WHERE id = $1", [sessionId]);

    await auditService.log({
      entity_type: 'interview',
      entity_id: sessionId,
      action: 'generate_evaluation',
      input_data: { session_id: sessionId },
      output_data: { coverage_items: evaluation.requirement_coverage.length },
      ai_model: ai.getModelName(),
      ai_prompt_summary: 'Generate standardized interview evaluation report',
      source_references: [],
    });

    return evaluation;
  }

  async getSession(sessionId: string) {
    const result = await query('SELECT * FROM interview_sessions WHERE id = $1', [sessionId]);
    if (result.rows.length === 0) {
      throw Object.assign(new Error('Interview session not found'), { statusCode: 404 });
    }

    const session = result.rows[0];

    const [questions, evidence, evaluations] = await Promise.all([
      query('SELECT * FROM interview_questions WHERE session_id = $1 ORDER BY priority, category', [sessionId]),
      query('SELECT * FROM interview_evidence WHERE session_id = $1', [sessionId]),
      query('SELECT * FROM interview_evaluations WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1', [sessionId]),
    ]);

    session.questions = questions.rows;
    session.evidence = evidence.rows;
    session.evaluation = evaluations.rows[0] || null;

    return session;
  }

  async getSessionsForCandidate(candidateId: string) {
    const result = await query(
      'SELECT * FROM interview_sessions WHERE candidate_id = $1 ORDER BY created_at DESC',
      [candidateId]
    );
    return result.rows;
  }
}

export const interviewService = new InterviewService();
