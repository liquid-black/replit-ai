import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { ProcessingRule, EmailProcessingResult } from '@shared/schema';

export class PDFGenerator {
  private ensureDownloadsDir(): string {
    const downloadsDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    return downloadsDir;
  }

  async generatePDF(
    extractedData: any, 
    rule: ProcessingRule, 
    email: any
  ): Promise<string> {
    const downloadsDir = this.ensureDownloadsDir();
    const filename = this.generateFilename(rule.outputTemplate, extractedData);
    const filepath = path.join(downloadsDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);

        // Add header
        doc.fontSize(20).text('Email Receipt', { align: 'center' });
        doc.moveDown();

        // Add email metadata
        const headers = this.extractHeaders(email);
        doc.fontSize(12)
           .text(`Subject: ${headers.Subject || 'Unknown'}`)
           .text(`From: ${headers.From || 'Unknown'}`)
           .text(`Date: ${headers.Date || 'Unknown'}`)
           .moveDown();

        // Add extracted data
        doc.fontSize(14).text('Extracted Information:', { underline: true });
        doc.moveDown(0.5);

        for (const [key, value] of Object.entries(extractedData)) {
          if (Array.isArray(value)) {
            doc.fontSize(12).text(`${this.formatFieldName(key)}:`);
            value.forEach((item, index) => {
              if (Array.isArray(item)) {
                doc.text(`  ${index + 1}. ${item.join(' | ')}`);
              } else {
                doc.text(`  ${index + 1}. ${item}`);
              }
            });
            doc.moveDown(0.3);
          } else {
            doc.fontSize(12).text(`${this.formatFieldName(key)}: ${value}`);
            doc.moveDown(0.3);
          }
        }

        // Add processing info
        doc.moveDown()
           .fontSize(10)
           .fillColor('gray')
           .text(`Generated on ${new Date().toISOString()}`, { align: 'right' });

        doc.end();

        stream.on('finish', () => {
          resolve(filepath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private extractHeaders(email: any): { [key: string]: string } {
    const headers: { [key: string]: string } = {};
    if (email.payload?.headers) {
      email.payload.headers.forEach((header: any) => {
        headers[header.name] = header.value;
      });
    }
    return headers;
  }

  private generateFilename(template: string, data: any): string {
    let filename = template;
    
    // Replace placeholders with actual data
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key}}`;
      if (filename.includes(placeholder)) {
        const sanitizedValue = String(value).replace(/[^a-zA-Z0-9.-]/g, '_');
        filename = filename.replace(placeholder, sanitizedValue);
      }
    }

    // Ensure it ends with .pdf
    if (!filename.endsWith('.pdf')) {
      filename += '.pdf';
    }

    // Add timestamp if no unique identifier
    if (filename === template) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename = `receipt_${timestamp}.pdf`;
    }

    return filename;
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  async generateCSV(results: EmailProcessingResult[]): Promise<string> {
    const downloadsDir = this.ensureDownloadsDir();
    const filename = `email_results_${Date.now()}.csv`;
    const filepath = path.join(downloadsDir, filename);

    const headers = ['Date', 'Subject', 'Sender', 'Service', 'Amount', 'Status'];
    const rows = [headers];

    results.forEach(result => {
      const data = result.extractedData as any;
      const amount = data.amount || data.total_amount || data.total || 'N/A';
      const service = this.extractServiceFromSubject(result.subject || '');
      
      rows.push([
        result.processedAt.toISOString().split('T')[0],
        result.subject || 'Unknown',
        result.sender || 'Unknown',
        service,
        amount,
        result.status
      ]);
    });

    const csvContent = rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    fs.writeFileSync(filepath, csvContent, 'utf-8');
    return filepath;
  }

  private extractServiceFromSubject(subject: string): string {
    if (subject.toLowerCase().includes('uber eats')) return 'Uber Eats';
    if (subject.toLowerCase().includes('uber')) return 'Uber';
    if (subject.toLowerCase().includes('instacart')) return 'Instacart';
    return 'Unknown';
  }
}

export const pdfGenerator = new PDFGenerator();
