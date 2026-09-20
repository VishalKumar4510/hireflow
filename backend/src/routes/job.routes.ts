import { Router, Response, NextFunction } from 'express';
import { jobService } from '../services/job.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { extractDocument } from '../document-processing/extractor';
import fs from 'fs';

const router = Router();
router.use(authMiddleware);

// List jobs
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jobs = await jobService.getJobs(req.recruiterId!);
    res.json(jobs);
  } catch (err) { next(err); }
});

// Get job detail
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await jobService.getJob(req.params.id as string);
    res.json(job);
  } catch (err) { next(err); }
});

// Create job
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, department, location, description } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }
    const job = await jobService.createJob(req.recruiterId!, { title, department: department || '', location: location || '', description });
    res.status(201).json(job);
  } catch (err) { next(err); }
});

// Create job from file upload
router.post('/upload', uploadSingle, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'File is required' });
      return;
    }

    const buffer = fs.readFileSync(file.path);
    const doc = await extractDocument(buffer, file.originalname, file.mimetype);

    const job = await jobService.createJob(req.recruiterId!, {
      title: req.body.title || 'Untitled Job',
      department: req.body.department || '',
      location: req.body.location || '',
      description: doc.text,
    });

    res.status(201).json(job);
  } catch (err) { next(err); }
});

// Analyze job (extract requirements)
router.post('/:id/analyze', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await jobService.analyzeJob(req.params.id as string);
    res.json(result);
  } catch (err) { next(err); }
});

// Update requirements
router.put('/:id/requirements', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { requirements } = req.body;
    if (!requirements || !Array.isArray(requirements)) {
      res.status(400).json({ error: 'Requirements array is required' });
      return;
    }
    const result = await jobService.updateRequirements(req.params.id as string, requirements);
    res.json(result);
  } catch (err) { next(err); }
});

// Get requirements
router.get('/:id/requirements', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requirements = await jobService.getRequirements(req.params.id as string);
    res.json(requirements);
  } catch (err) { next(err); }
});

// Delete job
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await jobService.deleteJob(req.params.id as string);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export { router as jobRoutes };
