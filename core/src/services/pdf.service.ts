import PdfPrinter from 'pdfmake';
import fs from 'fs';
import path from 'path';

// Define fonts
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

export class PdfService {
  static generateMedicalRecordPdf(patientName: string, content: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const docDefinition = {
        content: [
          { text: 'Medical Record', style: 'header' },
          { text: `Patient: ${patientName}`, style: 'subheader' },
          { text: `Date: ${new Date().toLocaleDateString()}`, style: 'subheader' },
          { text: '\n' },
          { text: content, style: 'body' }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          subheader: {
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 5]
          },
          body: {
            fontSize: 12,
            lineHeight: 1.5
          }
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition as any);
      const chunks: any[] = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));

      pdfDoc.end();
    });
  }
}
