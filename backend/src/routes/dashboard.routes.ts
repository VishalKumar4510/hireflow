import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { query } from '../database/connection';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recruiterId = req.recruiterId!;

    // Active jobs count
    const jobsResult = await query(
      "SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = $1 AND status = 'active'",
      [recruiterId]
    );

    // Total candidates
    const candidatesResult = await query(
      `SELECT COUNT(*) as count FROM candidates c
       JOIN jobs j ON c.job_id = j.id
       WHERE j.recruiter_id = $1`,
      [recruiterId]
    );

    // Interviews completed
    const interviewsResult = await query(
      `SELECT COUNT(*) as count FROM interview_sessions i
       JOIN jobs j ON i.job_id = j.id
       WHERE j.recruiter_id = $1 AND i.status IN ('completed', 'evaluated')`,
      [recruiterId]
    );

    // Candidates requiring validation (those with UNCLEAR or NOT_FOUND evidence)
    const validationResult = await query(
      `SELECT COUNT(DISTINCT em.candidate_id) as count
       FROM evidence_mappings em
       JOIN candidates c ON em.candidate_id = c.id
       JOIN jobs j ON c.job_id = j.id
       WHERE j.recruiter_id = $1 AND em.status IN ('UNCLEAR', 'NOT_FOUND')`,
      [recruiterId]
    );

    // Recent jobs
    const recentJobs = await query(
      `SELECT j.*,
        (SELECT COUNT(*) FROM candidates c WHERE c.job_id = j.id) as candidate_count,
        (SELECT COUNT(*) FROM interview_sessions i WHERE i.job_id = j.id AND i.status IN ('completed', 'evaluated')) as interview_count
       FROM jobs j
       WHERE j.recruiter_id = $1
       ORDER BY j.created_at DESC LIMIT 5`,
      [recruiterId]
    );

    // Recent activity from audit log
    const recentActivity = await query(
      `SELECT al.* FROM audit_log al
       JOIN jobs j ON (
         (al.entity_type = 'job' AND al.entity_id = j.id) OR
         (al.entity_type = 'candidate' AND al.entity_id IN (SELECT id FROM candidates WHERE job_id = j.id)) OR
         (al.entity_type = 'interview' AND al.entity_id IN (SELECT id FROM interview_sessions WHERE job_id = j.id))
       )
       WHERE j.recruiter_id = $1
       ORDER BY al.created_at DESC LIMIT 10`,
      [recruiterId]
    );

    res.json({
      active_jobs: parseInt(jobsResult.rows[0].count),
      total_candidates: parseInt(candidatesResult.rows[0].count),
      interviews_completed: parseInt(interviewsResult.rows[0].count),
      candidates_requiring_validation: parseInt(validationResult.rows[0].count),
      recent_jobs: recentJobs.rows,
      recent_activity: recentActivity.rows.map((a: Record<string, unknown>) => ({
        id: a.id,
        type: a.action,
        title: `${a.action}`.replace(/_/g, ' '),
        description: a.ai_prompt_summary || '',
        timestamp: a.created_at,
        entity_id: a.entity_id,
        entity_type: a.entity_type,
      })),
    });
  } catch (err) { next(err); }
});

export { router as dashboardRoutes };
