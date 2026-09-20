import { Router, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/entity/:entityType/:entityId', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await auditService.getLogsForEntity(_req.params.entityType as string, _req.params.entityId as string);
    res.json(logs);
  } catch (err) { next(err); }
});

router.get('/recent', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(_req.query.limit as string) || 50;
    const logs = await auditService.getRecentLogs(limit);
    res.json(logs);
  } catch (err) { next(err); }
});

export { router as auditRoutes };
