import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }
    const result = await authService.register(email, password, name);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.recruiterId!);
    res.json(profile);
  } catch (err) { next(err); }
});

export { router as authRoutes };
