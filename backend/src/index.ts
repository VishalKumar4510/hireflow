import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // Also check backend/.env

import { authRoutes } from './routes/auth.routes';
import { jobRoutes } from './routes/job.routes';
import { candidateRoutes } from './routes/candidate.routes';
import { interviewRoutes } from './routes/interview.routes';
import { searchRoutes } from './routes/search.routes';
import { auditRoutes } from './routes/audit.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { errorHandler } from './middleware/error.middleware';
import { initDatabase } from './database/connection';
import { setAIProvider } from './ai/provider';
import { createGeminiProvider } from './ai/gemini-provider';

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or any localhost / 127.0.0.1 port (5173, 5174, 5175, etc.)
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/audit', auditRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    await initDatabase();
    console.log('✅ Database initialized');

    // Initialize AI provider
    const gemini = createGeminiProvider();
    if (gemini) {
      setAIProvider(gemini);
    }

    app.listen(PORT, () => {
      console.log(`🚀 HireFlow backend running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Demo mode: ${process.env.DEMO_MODE || 'false'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;
