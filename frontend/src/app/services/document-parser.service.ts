import { Injectable } from '@angular/core';
import { ParsedDocument, PageContent, SheetContent } from '../models/parsed-document.model';

export class UnsupportedFileTypeError extends Error {
  constructor(type: string) { super(`Unsupported file type: ${type}`); }
}

export class FileTooLargeError extends Error {
  constructor(maxMb: number) { super(`File exceeds maximum size of ${maxMb} MB`); }
}

const FILE_SIGNATURES: { [key: string]: number[] } = {
  pdf: [0x25, 0x50, 0x44, 0x46],       // %PDF
  xlsx: [0x50, 0x4B, 0x03, 0x04],       // PK (ZIP)
  docx: [0x50, 0x4B, 0x03, 0x04],       // PK (ZIP)
};

@Injectable({ providedIn: 'root' })
export class DocumentParserService {

  async parseFile(file: File): Promise<ParsedDocument> {
    this.validateFile(file);
    const type = this.getFileType(file);

    switch (type) {
      case 'pdf': return this.parsePdf(file);
      case 'xlsx':
      case 'csv': return this.parseSpreadsheet(file);
      case 'docx': return this.parseDocx(file);
      case 'txt': return this.parseTxt(file);
      default: throw new UnsupportedFileTypeError(file.name);
    }
  }

  private validateFile(file: File): void {
    const limits: { [key: string]: number } = {
      pdf: 50, docx: 25, xlsx: 25, csv: 10, txt: 5
    };
    const type = this.getFileType(file);
    const maxMb = limits[type] || 10;
    if (file.size > maxMb * 1024 * 1024) {
      throw new FileTooLargeError(maxMb);
    }
  }

  getFileType(file: File): string {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const map: { [key: string]: string } = {
      pdf: 'pdf', xlsx: 'xlsx', xls: 'xlsx', csv: 'csv',
      ods: 'xlsx', docx: 'docx', txt: 'txt', md: 'txt'
    };
    return map[ext] || '';
  }

  getSupportedExtensions(): string[] {
    return ['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.ods', '.txt', '.md'];
  }

  async validateMagicBytes(file: File): Promise<boolean> {
    const type = this.getFileType(file);
    const sig = FILE_SIGNATURES[type];
    if (!sig) return true; // no signature check for txt/csv
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return sig.every((b, i) => bytes[i] === b);
  }

  private async parsePdf(file: File): Promise<ParsedDocument> {
    const pdfjsLib = await import('pdfjs-dist');
    // Load worker source as text and create blob URL to bypass MIME type issues
    // (Caddy reverse proxy can serve .mjs with wrong content-type)
    const resp = await fetch('/assets/pdf.worker.min.mjs');
    const workerCode = await resp.text();
    const blob = new Blob([workerCode], { type: 'text/javascript' });
    pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: PageContent[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      pages.push({ pageNumber: i, text });
    }

    return {
      fileName: file.name,
      fileType: 'pdf',
      totalPages: pdf.numPages,
      pages,
      extractedText: pages.map(p => p.text).join('\n\n'),
      extractedAt: new Date()
    };
  }

  private async parseSpreadsheet(file: File): Promise<ParsedDocument> {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sheets: SheetContent[] = workbook.SheetNames.map(name => {
      const sheet = workbook.Sheets[name];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      const text = json.map(row => row.join(' | ')).join('\n');
      return { sheetName: name, text, rowCount: json.length };
    });

    const ext = file.name.split('.').pop()?.toLowerCase();
    return {
      fileName: file.name,
      fileType: ext === 'csv' ? 'csv' : 'xlsx',
      totalPages: sheets.length,
      pages: sheets.map((s, i) => ({ pageNumber: i + 1, text: s.text })),
      extractedText: sheets.map(s => `[${s.sheetName}]\n${s.text}`).join('\n\n'),
      extractedAt: new Date()
    };
  }

  private async parseDocx(file: File): Promise<ParsedDocument> {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    return {
      fileName: file.name,
      fileType: 'docx',
      totalPages: 1,
      pages: [{ pageNumber: 1, text: result.value }],
      extractedText: result.value,
      extractedAt: new Date()
    };
  }

  private async parseTxt(file: File): Promise<ParsedDocument> {
    const text = await file.text();
    return {
      fileName: file.name,
      fileType: 'txt',
      totalPages: 1,
      pages: [{ pageNumber: 1, text }],
      extractedText: text,
      extractedAt: new Date()
    };
  }
}
