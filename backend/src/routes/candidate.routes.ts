import { Router, Response, NextFunction } from 'express';
import { candidateService } from '../services/candidate.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { uploadResumes } from '../middleware/upload.middleware';

const router = Router();
router.use(authMiddleware);

// Upload resumes for a job
router.post('/upload/:jobId', uploadResumes, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'At least one resume file is required' });
      return;
    }
    const result = await candidateService.uploadAndProcess(req.params.jobId as string, files);
    res.json(result);
  } catch (err) { next(err); }
});

// Get candidates for a job
router.get('/job/:jobId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const candidates = await candidateService.getCandidatesForJob(req.params.jobId as string);
    res.json(candidates);
  } catch (err) { next(err); }
});

// Get candidate detail
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const candidate = await candidateService.getCandidate(req.params.id as string);
    res.json(candidate);
  } catch (err) { next(err); }
});

// Map evidence for a candidate
router.post('/:id/map-evidence/:jobId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mappings = await candidateService.mapEvidence(req.params.id as string, req.params.jobId as string);
    res.json(mappings);
  } catch (err) { next(err); }
});

// Generate candidate summary
router.get('/:id/summary/:jobId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await candidateService.generateSummary(req.params.id as string, req.params.jobId as string);
    res.json(summary);
  } catch (err) { next(err); }
});

// Group candidates for a job
router.post('/group/:jobId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const groups = await candidateService.groupCandidates(req.params.jobId as string);
    res.json(groups);
  } catch (err) { next(err); }
});

export { router as candidateRoutes };
