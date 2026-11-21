import crypto from 'crypto';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export type SupportedResumeFormat = 'PDF' | 'DOCX' | 'DOC' | 'TXT' | 'RTF' | 'ODT';

export interface ProcessedResumeResult {
  fileName: string;
  fileFormat: SupportedResumeFormat;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  extractedText: string;
  previewHtml: string;
  previewType: 'pdf' | 'html' | 'text';
}

export const MAX_RESUME_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const FORMAT_MIME_MAP: Record<SupportedResumeFormat, string> = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC: 'application/msword',
  TXT: 'text/plain; charset=utf-8',
  RTF: 'application/rtf',
  ODT: 'application/vnd.oasis.opendocument.text',
};

const EXT_TO_FORMAT: Record<string, SupportedResumeFormat> = {
  '.pdf': 'PDF',
  '.docx': 'DOCX',
  '.doc': 'DOC',
  '.txt': 'TXT',
  '.rtf': 'RTF',
  '.odt': 'ODT',
};

const DISALLOWED_MIME_PREFIXES = [
  'image/',
  'audio/',
  'video/',
];

const DISALLOWED_MIME_EXACT = new Set([
  'application/x-msdownload',
  'application/x-dosexec',
  'application/x-executable',
  'application/x-sh',
  'application/x-shellscript',
  'application/javascript',
  'text/javascript',
  'text/html',
]);

export class ResumeValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ResumeValidationError';
    this.statusCode = statusCode;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&amp;/g, '&');
}

function sanitizeDocumentHtml(rawHtml: string): string {
  let clean = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/<img[\s\S]*?>/gi, '');

  // Strip event handlers & javascript:/data: URLs
  clean = clean
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|\')\s*(javascript:|data:|vbscript:)[^"']*("|\')/gi, '$1="#"');

  // Allow safe semantic tags only
  const allowedTags = new Set([
    'p',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'blockquote',
    'pre',
    'code',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'a',
    'span',
    'div',
  ]);

  clean = clean.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (full, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase();
    if (!allowedTags.has(tag)) return '';
    if (full.startsWith('</')) return `</${tag}>`;
    if (tag === 'a') {
      const hrefMatch = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const href = hrefMatch ? hrefMatch[1] || hrefMatch[2] || '#' : '#';
      const safeHref = /^https?:\/\/|^mailto:|^tel:|^#/i.test(href) ? escapeHtml(href) : '#';
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">`;
    }
    return `<${tag}>`;
  });

  return clean.trim();
}

function hasExecutableSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  // Windows PE / DOS EXE ('MZ')
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) return true;
  // Linux ELF ('\x7fELF')
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return true;
  }
  // Shebang script ('#!')
  if (buffer[0] === 0x23 && buffer[1] === 0x21) return true;
  // Mach-O binaries
  const u32 = buffer.readUInt32BE(0);
  if (
    u32 === 0xfeedface ||
    u32 === 0xfeedfacf ||
    u32 === 0xcffaedfe ||
    u32 === 0xcefaedfe ||
    u32 === 0xcafebabe
  ) {
    return true;
  }
  return false;
}

function isZipMagic(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
  );
}

function isOle2Magic(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  );
}

function textToParagraphHtml(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '<div class="h-3"></div>';
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join('\n');
}

function extractPdfBestEffortText(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const chunks: string[] = [];
  const regex = /\(([^()\\]{2,180}(?:\\.[^()\\]*)*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null && chunks.length < 400) {
    const cleaned = match[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\([()\\])/g, '$1')
      .replace(/[^\x20-\x7E\n]/g, ' ')
      .trim();
    if (cleaned.length >= 2 && /[a-zA-Z0-9]/.test(cleaned)) {
      chunks.push(cleaned);
    }
  }
  return chunks.join(' ').replace(/\s{2,}/g, ' ').slice(0, 12000).trim();
}

async function processPdf(buffer: Buffer): Promise<{
  extractedText: string;
  previewHtml: string;
  previewType: 'pdf';
}> {
  if (buffer.length < 100 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new ResumeValidationError(
      'Invalid PDF file. The uploaded file does not contain a valid %PDF- header.'
    );
  }
  const asciiContent = buffer.toString('latin1');
  if (/\/Encrypt\b/.test(asciiContent)) {
    throw new ResumeValidationError(
      'This PDF is password-protected or encrypted. Please upload an unlocked PDF resume.'
    );
  }
  if (!asciiContent.includes('%%EOF') && !asciiContent.includes('endobj')) {
    throw new ResumeValidationError('The uploaded PDF appears incomplete or corrupted.');
  }
  const extractedText = extractPdfBestEffortText(buffer);
  return { extractedText, previewHtml: '', previewType: 'pdf' };
}

async function processDocx(buffer: Buffer): Promise<{
  extractedText: string;
  previewHtml: string;
  previewType: 'html';
}> {
  if (isOle2Magic(buffer)) {
    throw new ResumeValidationError(
      'This DOCX file appears to be encrypted or password-protected. Please remove protection and upload again.'
    );
  }
  if (!isZipMagic(buffer)) {
    throw new ResumeValidationError(
      'Invalid DOCX file. The file contents do not match an Office Open XML (.docx) archive.'
    );
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new ResumeValidationError(
      'Corrupted DOCX file. Unable to read the internal document archive.'
    );
  }

  if (zip.file('EncryptionInfo') || zip.file('EncryptedPackage')) {
    throw new ResumeValidationError(
      'This DOCX document is password-protected. Please upload an unprotected DOCX resume.'
    );
  }

  if (!zip.file('word/document.xml')) {
    throw new ResumeValidationError(
      'Invalid DOCX structure. Missing word/document.xml inside the archive.'
    );
  }

  try {
    const [htmlRes, textRes] = await Promise.all([
      mammoth.convertToHtml({ buffer }),
      mammoth.extractRawText({ buffer }),
    ]);

    const extractedText = (textRes.value || '').trim();
    const sanitizedHtml = sanitizeDocumentHtml(htmlRes.value || '');
    const previewHtml = sanitizedHtml || textToParagraphHtml(extractedText);

    if (!extractedText && !previewHtml) {
      throw new ResumeValidationError('The uploaded DOCX document contains no readable content.');
    }

    return {
      extractedText: extractedText.slice(0, 100_000),
      previewHtml: previewHtml.slice(0, 200_000),
      previewType: 'html',
    };
  } catch (err) {
    if (err instanceof ResumeValidationError) throw err;
    throw new ResumeValidationError(
      'Unable to parse DOCX document contents. Please ensure the file is not corrupted.'
    );
  }
}

async function processOdt(buffer: Buffer): Promise<{
  extractedText: string;
  previewHtml: string;
  previewType: 'html';
}> {
  if (!isZipMagic(buffer)) {
    throw new ResumeValidationError(
      'Invalid ODT file. The file contents do not match an OpenDocument (.odt) archive.'
    );
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new ResumeValidationError(
      'Corrupted ODT file. Unable to unpack OpenDocument archive.'
    );
  }

  const manifestFile = zip.file('META-INF/manifest.xml');
  if (manifestFile) {
    const manifestXml = await manifestFile.async('text');
    if (/encryption-data/i.test(manifestXml)) {
      throw new ResumeValidationError(
        'This ODT document is password-protected or encrypted. Please upload an unlocked ODT resume.'
      );
    }
  }

  const mimetypeFile = zip.file('mimetype');
  if (mimetypeFile) {
    const declaredMime = (await mimetypeFile.async('text')).trim();
    if (
      declaredMime &&
      !declaredMime.includes('opendocument.text')
    ) {
      throw new ResumeValidationError(
        'Invalid OpenDocument type. Please upload an OpenDocument Text (.odt) resume.'
      );
    }
  }

  const contentFile = zip.file('content.xml');
  if (!contentFile) {
    throw new ResumeValidationError(
      'Invalid ODT structure. Missing content.xml inside the OpenDocument archive.'
    );
  }

  const contentXml = await contentFile.async('text');
  const htmlBlocks: string[] = [];
  const textBlocks: string[] = [];

  const blockRegex = /<text:(h|p)\b([^>]*)>([\s\S]*?)<\/text:\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(contentXml)) !== null) {
    const tagType = match[1].toLowerCase();
    const attrs = match[2];
    const inner = match[3]
      .replace(/<text:line-break\s*\/>/gi, '\n')
      .replace(/<text:tab\s*\/>/gi, '  ')
      .replace(/<text:s(?:\s+text:c="(\d+)")?\s*\/>/gi, (_m, cnt) =>
        ' '.repeat(Math.min(20, Number(cnt) || 1))
      )
      .replace(/<[^>]+>/g, '');

    const decoded = decodeXmlEntities(inner).trim();
    if (!decoded) continue;

    textBlocks.push(decoded);
    if (tagType === 'h') {
      const levelMatch = attrs.match(/text:outline-level="(\d+)"/i);
      const level = Math.min(4, Math.max(2, Number(levelMatch?.[1]) || 2));
      htmlBlocks.push(`<h${level}>${escapeHtml(decoded)}</h${level}>`);
    } else {
      htmlBlocks.push(`<p>${escapeHtml(decoded).replace(/\n/g, '<br />')}</p>`);
    }
  }

  const extractedText = textBlocks.join('\n').trim();
  const previewHtml = htmlBlocks.join('\n').trim();

  if (!extractedText) {
    throw new ResumeValidationError('The uploaded ODT document contains no readable text.');
  }

  return {
    extractedText: extractedText.slice(0, 100_000),
    previewHtml: previewHtml.slice(0, 200_000),
    previewType: 'html',
  };
}

function extractReadableRunsFromDoc(buffer: Buffer): string {
  const lines: string[] = [];
  // Legacy .doc stores Unicode text runs in UTF-16LE as well as ASCII blocks.
  // Scan UTF-16LE sequences of >= 5 printable chars first.
  const utf16Text = buffer.toString('utf16le');
  const utf16Matches = utf16Text.match(/[\x20-\x7E\r\n\t]{6,}/g) || [];
  for (const chunk of utf16Matches) {
    const cleaned = chunk
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (
      cleaned.length >= 4 &&
      /[a-zA-Z]{2,}/.test(cleaned) &&
      !/^(Root Entry|WordDocument|SummaryInformation|DocumentSummaryInformation|1Table|0Table|Data|ObjectPool|CompObj)$/i.test(
        cleaned
      )
    ) {
      lines.push(cleaned);
    }
  }

  // Fallback / supplement from ASCII sequences if sparse
  if (lines.join(' ').length < 60) {
    const ascii = buffer.toString('latin1');
    const asciiMatches = ascii.match(/[A-Za-z0-9][A-Za-z0-9 ,.;:!?@#%&()_+=\-\/'"]{5,}/g) || [];
    for (const chunk of asciiMatches) {
      const cleaned = chunk.trim();
      if (
        cleaned.length >= 5 &&
        /[a-zA-Z]{2,}/.test(cleaned) &&
        !/^(Microsoft Word|Word\.Document|Times New Roman|Calibri|Arial|Normal\.dotm)$/i.test(
          cleaned
        )
      ) {
        lines.push(cleaned);
      }
    }
  }

  // Deduplicate consecutive identical lines
  const deduped: string[] = [];
  for (const line of lines) {
    if (deduped[deduped.length - 1] !== line) {
      deduped.push(line);
    }
  }

  return deduped.join('\n').slice(0, 80_000).trim();
}

async function processDoc(buffer: Buffer): Promise<{
  extractedText: string;
  previewHtml: string;
  previewType: 'html';
}> {
  if (isZipMagic(buffer)) {
    throw new ResumeValidationError(
      'This file appears to be an Office Open XML (.docx) archive with a .doc extension. Please rename or save it as .docx.'
    );
  }
  if (!isOle2Magic(buffer)) {
    throw new ResumeValidationError(
      'Invalid DOC file. The uploaded file does not have a valid Microsoft Word 97-2003 (.doc) binary signature.'
    );
  }

  const utf16View = buffer.toString('utf16le');
  if (utf16View.includes('EncryptedPackage')) {
    throw new ResumeValidationError(
      'This DOC document appears to be password-protected or encrypted. Please upload an unprotected file.'
    );
  }
  if (!utf16View.includes('WordDocument')) {
    throw new ResumeValidationError(
      'The uploaded OLE2 file is not a valid Microsoft Word (.doc) document.'
    );
  }

  const extractedText = extractReadableRunsFromDoc(buffer);
  const previewHtml = extractedText
    ? textToParagraphHtml(extractedText)
    : '<p>Legacy Microsoft Word (.doc) file verified. Download the original file to view formatted layout in Word.</p>';

  return {
    extractedText,
    previewHtml,
    previewType: 'html',
  };
}

function parseRtfToText(rawRtf: string): string {
  let out = '';
  let i = 0;
  let groupDepth = 0;
  let skipDepth: number | null = null;
  const skipDestinations = new Set([
    'fonttbl',
    'colortbl',
    'stylesheet',
    'info',
    'pict',
    'object',
    'header',
    'footer',
    'headerl',
    'headerr',
    'headerf',
    'footerl',
    'footerr',
    'footerf',
    'listtable',
    'listoverridetable',
    'generator',
    'themedata',
    'colorschememapping',
    'latentstyles',
    'datastore',
    'xmlnstbl',
  ]);

  while (i < rawRtf.length) {
    const ch = rawRtf[i];
    if (ch === '{') {
      groupDepth++;
      if (skipDepth === null && rawRtf.slice(i + 1, i + 3) === '\\*') {
        skipDepth = groupDepth;
      }
      i++;
      continue;
    }
    if (ch === '}') {
      if (skipDepth !== null && groupDepth === skipDepth) {
        skipDepth = null;
      }
      groupDepth = Math.max(0, groupDepth - 1);
      i++;
      continue;
    }

    if (skipDepth !== null) {
      i++;
      continue;
    }

    if (ch === '\\') {
      const next = rawRtf[i + 1];
      if (!next) break;
      if (next === '\\' || next === '{' || next === '}') {
        out += next;
        i += 2;
        continue;
      }
      if (next === '\r' || next === '\n') {
        out += '\n';
        i += 2;
        continue;
      }
      if (next === "'") {
        const hex = rawRtf.slice(i + 2, i + 4);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          out += Buffer.from([Number.parseInt(hex, 16)]).toString('latin1');
          i += 4;
          continue;
        }
      }
      if (next === '~') {
        out += ' ';
        i += 2;
        continue;
      }
      if (next === '-' || next === '_') {
        out += next === '_' ? '-' : '';
        i += 2;
        continue;
      }

      const wordMatch = rawRtf.slice(i + 1).match(/^([a-zA-Z]+)(-?\d+)? ?/);
      if (wordMatch) {
        const word = wordMatch[1].toLowerCase();
        const param = wordMatch[2];
        i += 1 + wordMatch[0].length;

        if (skipDestinations.has(word)) {
          skipDepth = groupDepth;
          continue;
        }
        if (word === 'par' || word === 'line') {
          out += '\n';
        } else if (word === 'tab') {
          out += '  ';
        } else if (word === 'emdash') {
          out += '—';
        } else if (word === 'endash') {
          out += '–';
        } else if (word === 'bullet') {
          out += '• ';
        } else if (word === 'u' && param) {
          let code = Number(param);
          if (code < 0) code += 65536;
          if (Number.isFinite(code) && code > 0) {
            out += String.fromCodePoint(code);
          }
          // Skip fallback ANSI character after \uN if present
          if (rawRtf[i] && rawRtf[i] !== '\\' && rawRtf[i] !== '{' && rawRtf[i] !== '}') {
            i++;
          }
        }
        continue;
      }
      i += 2;
      continue;
    }

    if (ch === '\r' || ch === '\n') {
      i++;
      continue;
    }

    out += ch;
    i++;
  }

  return out
    .split('\n')
    .map((line) => line.replace(/\s{2,}/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function processRtf(buffer: Buffer): Promise<{
  extractedText: string;
  previewHtml: string;
  previewType: 'html';
}> {
  const raw = buffer.toString('latin1').replace(/^\uFEFF/, '').trimStart();
  if (!raw.toLowerCase().startsWith('{\\rtf')) {
    throw new ResumeValidationError(
      'Invalid RTF file. Rich Text documents must start with a valid {\\rtf header.'
    );
  }
  const extractedText = parseRtfToText(raw);
  if (!extractedText) {
    throw new ResumeValidationError('The uploaded RTF document contains no readable text.');
  }
  return {
    extractedText: extractedText.slice(0, 100_000),
    previewHtml: textToParagraphHtml(extractedText).slice(0, 200_000),
    previewType: 'html',
  };
}

async function processTxt(buffer: Buffer): Promise<{
  extractedText: string;
  previewHtml: string;
  previewType: 'text';
}> {
  if (buffer.includes(0x00)) {
    throw new ResumeValidationError(
      'Invalid TXT file. Binary or null-byte content is not permitted in plain-text resumes.'
    );
  }

  let decoded: string;
  try {
    decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    throw new ResumeValidationError(
      'Invalid TXT encoding. Please save your plain-text resume as UTF-8.'
    );
  }

  const normalized = decoded.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let nonPrintable = 0;
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10) {
      nonPrintable++;
    }
  }
  if (normalized.length > 0 && nonPrintable / normalized.length > 0.02) {
    throw new ResumeValidationError(
      'Invalid TXT file. Detected excessive non-printable binary control characters.'
    );
  }

  const trimmed = normalized.trim();
  if (trimmed.replace(/\s+/g, '').length < 10) {
    throw new ResumeValidationError(
      'Uploaded TXT file is too short or empty. Please upload a complete text resume.'
    );
  }

  return {
    extractedText: trimmed.slice(0, 100_000),
    previewHtml: textToParagraphHtml(trimmed).slice(0, 200_000),
    previewType: 'text',
  };
}

export function detectFormatFromExtension(fileName: string): SupportedResumeFormat | null {
  const lower = fileName.trim().toLowerCase();
  const dotIdx = lower.lastIndexOf('.');
  if (dotIdx < 0) return null;
  const ext = lower.slice(dotIdx);
  return EXT_TO_FORMAT[ext] || null;
}

export function sanitizeResumeFileName(originalName: string, format: SupportedResumeFormat): string {
  const ext = `.${format.toLowerCase()}`;
  const base = originalName
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+/, '');
  if (!base) return `Resume${ext}`;
  if (base.toLowerCase().endsWith(ext)) return base.slice(0, 180);
  return `${base.slice(0, 170)}${ext}`;
}

export async function processResumeUpload(
  buffer: Buffer,
  originalName: string,
  claimedMimeType: string
): Promise<ProcessedResumeResult> {
  if (!buffer || buffer.length === 0) {
    throw new ResumeValidationError('The uploaded resume file is empty.');
  }
  if (buffer.length > MAX_RESUME_FILE_BYTES) {
    throw new ResumeValidationError('File exceeds the 10 MB maximum upload limit.');
  }
  if (hasExecutableSignature(buffer)) {
    throw new ResumeValidationError(
      'Security validation failed: executable or script binaries are strictly rejected.'
    );
  }

  const normalizedMime = (claimedMimeType || '').toLowerCase().split(';')[0].trim();
  if (
    DISALLOWED_MIME_EXACT.has(normalizedMime) ||
    DISALLOWED_MIME_PREFIXES.some((prefix) => normalizedMime.startsWith(prefix))
  ) {
    throw new ResumeValidationError(
      `Unsupported file MIME type (${normalizedMime}). Please upload PDF, DOCX, DOC, TXT, RTF, or ODT.`
    );
  }

  const format = detectFormatFromExtension(originalName);
  if (!format) {
    throw new ResumeValidationError(
      'Unsupported file format. Accepted formats: PDF (.pdf), Word (.docx, .doc), Plain Text (.txt), Rich Text (.rtf), and OpenDocument (.odt).'
    );
  }

  let parsed: { extractedText: string; previewHtml: string; previewType: 'pdf' | 'html' | 'text' };
  switch (format) {
    case 'PDF':
      parsed = await processPdf(buffer);
      break;
    case 'DOCX':
      parsed = await processDocx(buffer);
      break;
    case 'DOC':
      parsed = await processDoc(buffer);
      break;
    case 'TXT':
      parsed = await processTxt(buffer);
      break;
    case 'RTF':
      parsed = await processRtf(buffer);
      break;
    case 'ODT':
      parsed = await processOdt(buffer);
      break;
  }

  return {
    fileName: sanitizeResumeFileName(originalName, format),
    fileFormat: format,
    mimeType: FORMAT_MIME_MAP[format],
    fileSizeBytes: buffer.length,
    sha256Hash: crypto.createHash('sha256').update(buffer).digest('hex'),
    extractedText: parsed.extractedText,
    previewHtml: parsed.previewHtml,
    previewType: parsed.previewType,
  };
}

export function verifyStoredResumeBuffer(buffer: Buffer, fileFormat: string): boolean {
  if (!buffer || buffer.length === 0 || hasExecutableSignature(buffer)) {
    return false;
  }
  const fmt = (fileFormat || 'PDF').toUpperCase();
  switch (fmt) {
    case 'PDF':
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    case 'DOCX':
    case 'ODT':
      return isZipMagic(buffer);
    case 'DOC':
      return isOle2Magic(buffer);
    case 'RTF':
      return buffer.toString('latin1').replace(/^\uFEFF/, '').trimStart().toLowerCase().startsWith('{\\rtf');
    case 'TXT':
      return !buffer.includes(0x00);
    default:
      return false;
  }
}
