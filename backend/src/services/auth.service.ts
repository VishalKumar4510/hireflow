import bcrypt from 'bcryptjs';
import { query } from '../database/connection';
import { generateToken } from '../middleware/auth.middleware';

export class AuthService {
  async login(email: string, password: string) {
    const result = await query('SELECT * FROM recruiters WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    const recruiter = result.rows[0];
    const valid = await bcrypt.compare(password, recruiter.password_hash);
    if (!valid) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    const token = generateToken(recruiter.id, recruiter.email);
    return {
      token,
      recruiter: {
        id: recruiter.id,
        email: recruiter.email,
        name: recruiter.name,
        created_at: recruiter.created_at,
      },
    };
  }

  async register(email: string, password: string, name: string) {
    const existing = await query('SELECT id FROM recruiters WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO recruiters (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, passwordHash, name]
    );

    const recruiter = result.rows[0];
    const token = generateToken(recruiter.id, recruiter.email);
    return { token, recruiter };
  }

  async getProfile(recruiterId: string) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!recruiterId || !UUID_REGEX.test(recruiterId)) {
      throw Object.assign(new Error('Invalid recruiter ID format: expected a valid UUID'), { statusCode: 400 });
    }
    const result = await query(
      'SELECT id, email, name, created_at FROM recruiters WHERE id = $1',
      [recruiterId]
    );
    if (result.rows.length === 0) {
      throw Object.assign(new Error('Recruiter not found'), { statusCode: 404 });
    }
    return result.rows[0];
  }
}

export const authService = new AuthService();
