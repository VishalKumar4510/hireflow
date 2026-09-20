import { DocumentChunk } from './extractor';

interface ChunkOptions {
  maxChunkSize: number;
  overlap: number;
}

/**
 * Split text into overlapping chunks for embedding generation.
 * Attempts to split on section boundaries first, then sentence boundaries.
 */
export function chunkText(text: string, options: ChunkOptions = { maxChunkSize: 1000, overlap: 200 }): DocumentChunk[] {
  const { maxChunkSize, overlap } = options;
  const chunks: DocumentChunk[] = [];

  // Try to detect sections (headings, section markers)
  const sections = detectSections(text);

  if (sections.length > 1) {
    // Process by section
    let chunkIndex = 0;
    for (const section of sections) {
      if (section.content.length <= maxChunkSize) {
        chunks.push({
          text: section.content.trim(),
          index: chunkIndex++,
          section: section.heading,
          metadata: { section: section.heading },
        });
      } else {
        // Split large sections into smaller chunks
        const subChunks = splitBySentence(section.content, maxChunkSize, overlap);
        for (const subChunk of subChunks) {
          chunks.push({
            text: subChunk.trim(),
            index: chunkIndex++,
            section: section.heading,
            metadata: { section: section.heading },
          });
        }
      }
    }
  } else {
    // No sections detected, split by sentence
    const textChunks = splitBySentence(text, maxChunkSize, overlap);
    textChunks.forEach((chunk, index) => {
      chunks.push({
        text: chunk.trim(),
        index,
        metadata: {},
      });
    });
  }

  return chunks.filter(c => c.text.length > 20);
}

interface Section {
  heading: string;
  content: string;
}

function detectSections(text: string): Section[] {
  const sections: Section[] = [];
  // Common resume section headers
  const sectionPattern = /^(?:#{1,3}\s+)?(?:(?:PROFESSIONAL\s+)?(?:SUMMARY|OBJECTIVE|EXPERIENCE|WORK\s+HISTORY|EDUCATION|SKILLS|TECHNICAL\s+SKILLS|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS|AWARDS|PUBLICATIONS|REFERENCES|CONTACT|PROFILE|QUALIFICATIONS|COMPETENCIES|INTERESTS|ACTIVITIES))[\s:]*$/gmi;

  const matches: { heading: string; index: number }[] = [];
  let match;
  while ((match = sectionPattern.exec(text)) !== null) {
    matches.push({ heading: match[0].trim().replace(/^#+\s*/, ''), index: match.index });
  }

  if (matches.length === 0) {
    return [{ heading: 'Full Document', content: text }];
  }

  // Add intro section
  if (matches[0].index > 50) {
    sections.push({
      heading: 'Header / Contact',
      content: text.substring(0, matches[0].index),
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    sections.push({
      heading: matches[i].heading,
      content: text.substring(start, end),
    });
  }

  return sections;
}

function splitBySentence(text: string, maxSize: number, overlap: number): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxSize && current.length > 0) {
      chunks.push(current);
      // Keep overlap from end of current chunk
      const words = current.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      current = overlapWords.join(' ') + ' ' + sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current);
  }

  return chunks;
}
