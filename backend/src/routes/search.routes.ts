import { Router, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { query: queryText, job_id, filters, limit } = req.body;
    if (!queryText) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }
    const results = await searchService.search(queryText, job_id, filters, limit || 20);
    res.json(results);
  } catch (err) { next(err); }
});

export { router as searchRoutes };
