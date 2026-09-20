import { Router, Response, NextFunction } from 'express';
import { interviewService } from '../services/interview.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// Create interview session
router.post('/session', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { candidate_id, job_id } = req.body;
    if (!candidate_id || !job_id) {
      res.status(400).json({ error: 'candidate_id and job_id are required' });
      return;
    }
    const session = await interviewService.createSession(candidate_id, job_id);
    res.status(201).json(session);
  } catch (err) { next(err); }
});

// Get session
router.get('/session/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = await interviewService.getSession(req.params.id as string);
    res.json(session);
  } catch (err) { next(err); }
});

// Generate questions
router.post('/session/:id/questions', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { focus_areas } = req.body;
    const questions = await interviewService.generateQuestions(req.params.id as string, focus_areas);
    res.json(questions);
  } catch (err) { next(err); }
});

// Submit interview notes
router.post('/session/:id/notes', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;
    if (!notes) {
      res.status(400).json({ error: 'Interview notes are required' });
      return;
    }
    const session = await interviewService.submitNotes(req.params.id as string, notes);
    res.json(session);
  } catch (err) { next(err); }
});

// Analyze interview
router.post('/session/:id/analyze', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await interviewService.analyzeInterview(req.params.id as string);
    res.json(result);
  } catch (err) { next(err); }
});

// Generate evaluation
router.post('/session/:id/evaluate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const evaluation = await interviewService.generateEvaluation(req.params.id as string);
    res.json(evaluation);
  } catch (err) { next(err); }
});

// Get sessions for candidate
router.get('/candidate/:candidateId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessions = await interviewService.getSessionsForCandidate(req.params.candidateId as string);
    res.json(sessions);
  } catch (err) { next(err); }
});

export { router as interviewRoutes };
