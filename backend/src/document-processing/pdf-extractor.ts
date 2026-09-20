import pdf from 'pdf-parse';

export interface PDFResult {
  text: string;
  pageCount: number;
}

export async function extractPDF(buffer: Buffer): Promise<PDFResult> {
  try {
    const data = await pdf(buffer);
    return {
      text: data.text || '',
      pageCount: data.numpages || 0,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${(error as Error).message}`);
  }
}
