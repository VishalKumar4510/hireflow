import { Pool, PoolClient } from 'pg';
import pgvector from 'pgvector/pg';
import fs from 'fs';
import path from 'path';
import { handleDemoQuery } from './demo-store';

let pool: Pool;
let isConnected = false;

export function isDatabaseConnected(): boolean {
  return isConnected;
}

export function getPool(): Pool {
  if (!pool) {
    const isRemote = process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes('localhost') &&
      !process.env.DATABASE_URL.includes('127.0.0.1');

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'hireflow',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: isRemote ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('connect', async (client: PoolClient) => {
      try {
        await pgvector.registerTypes(client);
      } catch {
        // pgvector extension may not be available — non-fatal
      }
    });

    pool.on('error', (err: Error) => {
      console.error('Unexpected pool error:', err);
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  if (!isConnected && process.env.DEMO_MODE === 'true') {
    return handleDemoQuery(text, params as any[]);
  }

  try {
    const p = getPool();
    const start = Date.now();
    const result = await p.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms): ${text.substring(0, 100)}`);
    }
    return result;
  } catch (err: unknown) {
    const error = err as Error & { code?: string };
    const connErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'];
    const isConnErr = connErrors.includes(error.code || '') ||
      error.message?.includes('connect') ||
      error.message?.includes('ECONNREFUSED') ||
      (error as { constructor?: { name?: string } }).constructor?.name === 'AggregateError';

    if (isConnErr && process.env.DEMO_MODE === 'true') {
      isConnected = false;
      return handleDemoQuery(text, params as any[]);
    }
    throw err;
  }
}

export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

export async function initDatabase() {
  const p = getPool();

  try {
    // Test connection
    await p.query('SELECT 1');
    isConnected = true;
    console.log('✅ PostgreSQL connected');

    // Run schema
    let schemaPath = path.resolve(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.resolve(__dirname, '../../src/database/schema.sql');
    }
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.resolve(process.cwd(), 'src/database/schema.sql');
    }
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      await p.query(schema);
      console.log('✅ Schema applied');
    }
  } catch (err: unknown) {
    isConnected = false;
    const error = err as Error & { code?: string };
    const connErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'];
    const isConnectionError = connErrors.includes(error.code || '') ||
      error.message?.includes('connect') ||
      error.message?.includes('ECONNREFUSED') ||
      (error as { constructor?: { name?: string } }).constructor?.name === 'AggregateError';

    if (isConnectionError) {
      console.warn('⚠️  PostgreSQL not available. Running with in-memory demo fallback.');
      console.warn('   Start PostgreSQL: docker compose up -d');
      console.warn('   Then restart the backend for full persistence.');
    } else {
      throw err;
    }
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
  }
}
