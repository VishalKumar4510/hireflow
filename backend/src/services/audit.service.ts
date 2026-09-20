import { query } from '../database/connection';

export class AuditService {
  async log(entry: {
    entity_type: string;
    entity_id: string;
    action: string;
    input_data: Record<string, unknown>;
    output_data: Record<string, unknown>;
    ai_model: string;
    ai_prompt_summary: string;
    source_references: Array<Record<string, unknown>>;
  }) {
    try {
      await query(
        `INSERT INTO audit_log (entity_type, entity_id, action, input_data, output_data, ai_model, ai_prompt_summary, source_references)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          entry.entity_type,
          entry.entity_id,
          entry.action,
          JSON.stringify(entry.input_data),
          JSON.stringify(entry.output_data),
          entry.ai_model,
          entry.ai_prompt_summary,
          JSON.stringify(entry.source_references),
        ]
      );
    } catch (error) {
      console.error('Audit log error:', (error as Error).message);
      // Non-fatal: don't let audit logging break the main flow
    }
  }

  async getLogsForEntity(entityType: string, entityId: string) {
    const result = await query(
      'SELECT * FROM audit_log WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [entityType, entityId]
    );
    return result.rows;
  }

  async getRecentLogs(limit: number = 50) {
    const result = await query(
      'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }

  async getLogsByAction(action: string, limit: number = 50) {
    const result = await query(
      'SELECT * FROM audit_log WHERE action = $1 ORDER BY created_at DESC LIMIT $2',
      [action, limit]
    );
    return result.rows;
  }
}

export const auditService = new AuditService();
