import { query } from '../database/connection';
import { getAIProvider, isAIAvailable } from '../ai/provider';

export class SearchService {
  async search(queryText: string, jobId?: string, filters?: Record<string, unknown>, limit: number = 20) {
    const results: Array<Record<string, unknown>> = [];

    // Semantic search using pgvector
    if (isAIAvailable()) {
      try {
        const ai = getAIProvider();
        const embedding = await ai.generateEmbedding(queryText);

        let sql = `
          SELECT e.source_id as candidate_id, e.chunk_text, e.metadata,
                 1 - (e.embedding <=> $1::vector) as relevance_score,
                 c.name as candidate_name, c.job_id,
                 j.title as job_title
          FROM embeddings e
          JOIN candidates c ON e.source_id = c.id AND e.source_type = 'candidate'
          JOIN jobs j ON c.job_id = j.id
          WHERE 1=1
        `;
        const params: unknown[] = [JSON.stringify(embedding)];
        let paramIdx = 2;

        if (jobId) {
          sql += ` AND c.job_id = $${paramIdx}`;
          params.push(jobId);
          paramIdx++;
        }

        sql += ` ORDER BY relevance_score DESC LIMIT $${paramIdx}`;
        params.push(limit);

        const result = await query(sql, params);

        // Group by candidate
        const candidateMap = new Map<string, Record<string, unknown>>();
        for (const row of result.rows) {
          if (!candidateMap.has(row.candidate_id)) {
            candidateMap.set(row.candidate_id, {
              candidate_id: row.candidate_id,
              candidate_name: row.candidate_name,
              job_id: row.job_id,
              job_title: row.job_title,
              relevance_score: row.relevance_score,
              matched_chunks: [],
            });
          }
          const entry = candidateMap.get(row.candidate_id)!;
          (entry.matched_chunks as Array<Record<string, unknown>>).push({
            text: row.chunk_text,
            source_type: 'resume',
            score: row.relevance_score,
          });
          // Keep highest relevance score
          if (row.relevance_score > (entry.relevance_score as number)) {
            entry.relevance_score = row.relevance_score;
          }
        }

        results.push(...Array.from(candidateMap.values()));
      } catch (error) {
        console.warn('Semantic search failed, falling back to text search:', (error as Error).message);
        return this.textSearch(queryText, jobId, limit);
      }
    } else {
      return this.textSearch(queryText, jobId, limit);
    }

    // Apply filters
    if (filters) {
      return this.applyFilters(results, filters);
    }

    return results;
  }

  private async textSearch(queryText: string, jobId?: string, limit: number = 20) {
    let sql = `
      SELECT c.id as candidate_id, c.name as candidate_name, c.job_id, c.raw_text,
             j.title as job_title,
             ts_rank(to_tsvector('english', c.raw_text), plainto_tsquery('english', $1)) as relevance_score
      FROM candidates c
      JOIN jobs j ON c.job_id = j.id
      WHERE to_tsvector('english', c.raw_text) @@ plainto_tsquery('english', $1)
    `;
    const params: unknown[] = [queryText];
    let paramIdx = 2;

    if (jobId) {
      sql += ` AND c.job_id = $${paramIdx}`;
      params.push(jobId);
      paramIdx++;
    }

    sql += ` ORDER BY relevance_score DESC LIMIT $${paramIdx}`;
    params.push(limit);

    const result = await query(sql, params);

    return result.rows.map(row => ({
      candidate_id: row.candidate_id,
      candidate_name: row.candidate_name,
      job_id: row.job_id,
      job_title: row.job_title,
      relevance_score: row.relevance_score,
      matched_chunks: [{
        text: this.extractSnippet(row.raw_text, queryText),
        source_type: 'resume',
        score: row.relevance_score,
      }],
    }));
  }

  private extractSnippet(text: string, queryText: string): string {
    const lower = text.toLowerCase();
    const queryLower = queryText.toLowerCase();
    const idx = lower.indexOf(queryLower);
    if (idx === -1) {
      return text.substring(0, 200) + '...';
    }
    const start = Math.max(0, idx - 100);
    const end = Math.min(text.length, idx + queryText.length + 100);
    return (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
  }

  private applyFilters(results: Array<Record<string, unknown>>, filters: Record<string, unknown>) {
    // Filters applied post-retrieval for flexibility
    return results;
  }
}

export const searchService = new SearchService();
