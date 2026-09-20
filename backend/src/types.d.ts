declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
    text: string;
  }

  function pdf(dataBuffer: Buffer, options?: Record<string, unknown>): Promise<PDFData>;
  export = pdf;
}

declare module 'pgvector/pg' {
  import { PoolClient } from 'pg';
  function registerTypes(client: PoolClient): Promise<void>;
  function toSql(embedding: number[]): string;
  export default { registerTypes, toSql };
}
