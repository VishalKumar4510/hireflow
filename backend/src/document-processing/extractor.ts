// ============================================================
// Document Processing — Unified Extractor
// ============================================================

import { extractPDF } from './pdf-extractor';
import { extractDOCX } from './docx-extractor';
import { extractText } from './text-extractor';
import { chunkText } from './chunker';

export interface ExtractedDocument {
  text: string;
  pageCount?: number;
  metadata: Record<string, string>;
  chunks: DocumentChunk[];
}

export interface DocumentChunk {
  text: string;
  index: number;
  section?: string;
  metadata: Record<string, string>;
}

export async function extractDocument(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ExtractedDocument> {
  let text = '';
  let pageCount: number | undefined;
  const metadata: Record<string, string> = { fileName, mimeType };

  const ext = fileName.toLowerCase().split('.').pop() || '';

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    const result = await extractPDF(buffer);
    text = result.text;
    pageCount = result.pageCount;
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    text = await extractDOCX(buffer);
  } else if (mimeType === 'text/plain' || ext === 'txt') {
    text = extractText(buffer);
  } else {
    throw new Error(`Unsupported file type: ${mimeType} (${ext})`);
  }

  if (!text || text.trim().length < 50) {
    throw new Error('Could not extract sufficient text from document. The file may be empty, scanned, or corrupted.');
  }

  const chunks = chunkText(text, { maxChunkSize: 1000, overlap: 200 });

  return { text: text.trim(), pageCount, metadata, chunks };
}
