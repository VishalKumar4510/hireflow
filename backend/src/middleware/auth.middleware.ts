import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hireflow-jwt-secret-change-in-production';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AuthRequest extends Request {
  recruiterId?: string;
  recruiterEmail?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    if (!decoded.id || !UUID_REGEX.test(decoded.id)) {
      res.status(401).json({ error: 'Invalid authentication token: recruiter ID is not a valid UUID' });
      return;
    }
    req.recruiterId = decoded.id;
    req.recruiterEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function generateToken(id: string, email: string): string {
  if (!UUID_REGEX.test(id)) {
    throw new Error(`Cannot generate JWT: "${id}" is not a valid UUID`);
  }
  return jwt.sign({ id, email }, JWT_SECRET, {
    expiresIn: 86400, // 24 hours in seconds
  });
}
