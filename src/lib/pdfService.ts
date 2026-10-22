/**
 * Mizizi Studio - Client-Side PDF Engine
 * Powered by pdf-lib for in-browser PDF manipulation:
 * Merge, Split, Rotate, Images-to-PDF, Metadata Inspection
 */

import { PDFDocument, degrees, rgb } from 'pdf-lib';

export interface PdfMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export class PdfService {
  /**
   * Merge multiple PDF files into a single PDF
   */
  public static async mergePdfs(pdfFiles: File[]): Promise<Blob> {
    if (!pdfFiles || pdfFiles.length === 0) {
      throw new Error('At least one PDF file is required to merge.');
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of pdfFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    return new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
  }

  /**
   * Split PDF or extract specific page range (e.g. "1-3, 5")
   */
  public static async extractPages(pdfFile: File, pageRangesStr: string): Promise<Blob> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = srcDoc.getPageCount();

    const newDoc = await PDFDocument.create();
    const targetIndices = this.parsePageRanges(pageRangesStr, totalPages);

    if (targetIndices.length === 0) {
      throw new Error('No valid pages found in the specified range.');
    }

    const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);
    copiedPages.forEach((page) => newDoc.addPage(page));

    const pdfBytes = await newDoc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  /**
   * Rotate pages in a PDF by 90, 180, or 270 degrees
   */
  public static async rotatePdfPages(pdfFile: File, rotationDeg: 90 | 180 | 270, pageScope: 'all' | number[]): Promise<Blob> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer);
    const pages = doc.getPages();

    pages.forEach((page, idx) => {
      if (pageScope === 'all' || pageScope.includes(idx + 1)) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotationDeg) % 360));
      }
    });

    const pdfBytes = await doc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  /**
   * Convert image files (PNG/JPG) to a multi-page PDF
   */
  public static async imagesToPdf(imageFiles: File[]): Promise<Blob> {
    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('At least one image is required.');
    }

    const pdfDoc = await PDFDocument.create();

    for (const imgFile of imageFiles) {
      const buffer = await imgFile.arrayBuffer();
      let embeddedImg;

      if (imgFile.type.includes('png')) {
        embeddedImg = await pdfDoc.embedPng(buffer);
      } else {
        embeddedImg = await pdfDoc.embedJpg(buffer);
      }

      const imgDims = embeddedImg.scale(1);
      // Standard A4 or fit image dimensions
      const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: imgDims.width,
        height: imgDims.height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  /**
   * Stamp Page Numbers on a PDF
   */
  public static async addPageNumbers(pdfFile: File, format: 'Page X of Y' | 'X' = 'Page X of Y'): Promise<Blob> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer);
    const totalPages = doc.getPageCount();

    doc.getPages().forEach((page, idx) => {
      const { width } = page.getSize();
      const pageNum = idx + 1;
      const text = format === 'Page X of Y' ? `Page ${pageNum} of ${totalPages}` : `${pageNum}`;

      page.drawText(text, {
        x: width / 2 - 35,
        y: 20,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
      });
    });

    const pdfBytes = await doc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  /**
   * Inspect PDF metadata
   */
  public static async inspectPdf(pdfFile: File): Promise<PdfMetadata> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    return {
      pageCount: doc.getPageCount(),
      title: doc.getTitle() || undefined,
      author: doc.getAuthor() || undefined,
      subject: doc.getSubject() || undefined,
      creator: doc.getCreator() || undefined,
      producer: doc.getProducer() || undefined,
      creationDate: doc.getCreationDate() || undefined,
      modificationDate: doc.getModificationDate() || undefined,
    };
  }

  /**
   * Helper: parse page ranges string (e.g. "1-3, 5, 8-10") into 0-indexed integer array
   */
  private static parsePageRanges(rangesStr: string, totalPages: number): number[] {
    const indices: Set<number> = new Set();
    const parts = rangesStr.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(totalPages, Math.max(start, end));
          for (let p = min; p <= max; p++) {
            indices.add(p - 1);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          indices.add(p - 1);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  }
}
