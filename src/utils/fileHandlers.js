import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export function getFileExtension(filename) {
  if (!filename || !filename.includes('.')) return 'txt';
  return filename.split('.').pop().toLowerCase();
}

export function detectFormat(filename) {
  const ext = getFileExtension(filename);
  if (['csv', 'tsv'].includes(ext)) return 'csv';
  if (['json'].includes(ext)) return 'json';
  if (['xml'].includes(ext)) return 'xml';
  if (['docx'].includes(ext)) return 'docx';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['xlsx', 'xls'].includes(ext)) return 'xlsx';
  if (['eml'].includes(ext)) return 'eml';
  return 'text';
}

export async function extractTextFromPdf(fileOrBuffer) {
  const arrayBuffer = fileOrBuffer instanceof ArrayBuffer ? fileOrBuffer : await fileOrBuffer.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pagesText = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageLines = [];
    let currentLine = '';
    let lastY = null;

    for (const item of textContent.items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        if (currentLine.trim()) pageLines.push(currentLine.trim());
        currentLine = '';
      }
      currentLine += (item.str || '') + ' ';
      lastY = item.transform[5];
    }
    if (currentLine.trim()) pageLines.push(currentLine.trim());

    pagesText.push(`=== PAGE ${pageNum} ===\n` + pageLines.join('\n'));
  }

  return pagesText.join('\n\n');
}

export function exportSanitizedPdf(text, filename = 'sanitized_document.pdf') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const maxLineWidth = pageWidth - margin * 2;
  const lineHeight = 14;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const lines = doc.splitTextToSize(text, maxLineWidth);
  let cursorY = margin;

  for (let i = 0; i < lines.length; i++) {
    if (cursorY + lineHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(lines[i], margin, cursorY);
    cursorY += lineHeight;
  }

  doc.save(filename);
}

export async function parseXlsxWorkbook(fileOrBuffer) {
  const arrayBuffer = fileOrBuffer instanceof ArrayBuffer ? fileOrBuffer : await fileOrBuffer.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheets = {};

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    sheets[sheetName] = matrix;
  }

  return { workbook, sheets, sheetNames: workbook.SheetNames };
}

export function rebuildXlsxWorkbook(sanitizedSheets, originalSheetNames) {
  const newWb = XLSX.utils.book_new();
  for (const name of originalSheetNames) {
    const matrix = sanitizedSheets[name] || [];
    const ws = XLSX.utils.aoa_to_sheet(matrix);
    XLSX.utils.book_append_sheet(newWb, ws, name);
  }
  const wbOut = XLSX.write(newWb, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBlob(b64Data, contentType = 'application/octet-stream') {
  const byteCharacters = atob(b64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(text, filename, mimeType = 'text/plain') {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, filename);
}

export async function createBatchZip(files) {
  const zip = new JSZip();
  for (const f of files) {
    if (f.sanitizedBlob) {
      zip.file(f.sanitizedFilename, f.sanitizedBlob);
    } else if (f.sanitizedText) {
      zip.file(f.sanitizedFilename, f.sanitizedText);
    }
  }
  return await zip.generateAsync({ type: 'blob' });
}

export function parseDelimitedTextToMatrix(text, delimiter = ',') {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const nextCh = text[i + 1];

    if (ch === '"') {
      if (insideQuotes && nextCh === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (ch === delimiter && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((ch === '\r' || ch === '\n') && !insideQuotes) {
      if (ch === '\r' && nextCh === '\n') i++;
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += ch;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim().length > 0));
}
