import * as cheerio from 'cheerio';
import { ProcessingRule } from '@shared/schema';

export interface ExtractedData {
  [key: string]: any;
}

export class EmailProcessor {
  extractDataFromEmail(email: any, rule: ProcessingRule): ExtractedData {
    const headers = this.extractHeaders(email);
    const htmlBody = this.extractHtmlBody(email);
    const $ = cheerio.load(htmlBody);

    const extractedData: ExtractedData = {};

    for (const field of rule.fields as any[]) {
      try {
        const value = this.extractField($, headers, field);
        if (field.process === "extract_items" && "special_values" in field) {
          const [items, specialValues] = value as [any[], { [key: string]: any }];
          extractedData[field.name] = items;
          Object.assign(extractedData, specialValues);
        } else {
          extractedData[field.name] = value;
        }
      } catch (error) {
        console.error(`Failed to extract field ${field.name}:`, error);
        extractedData[field.name] = "Unknown";
      }
    }

    return extractedData;
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

  private extractHtmlBody(email: any): string {
    function extractFromPart(part: any): string {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      
      if (part.parts) {
        for (const subPart of part.parts) {
          const html = extractFromPart(subPart);
          if (html) return html;
        }
      }
      
      return '';
    }

    if (email.payload?.body?.data && email.payload.mimeType === 'text/html') {
      return Buffer.from(email.payload.body.data, 'base64').toString('utf-8');
    }

    return extractFromPart(email.payload);
  }

  private extractField($: cheerio.CheerioAPI, headers: { [key: string]: string }, field: any): any {
    if (field.source === "header") {
      const value = headers[field.key] || "Unknown";
      return this.postProcess(value, field.post_process);
    }

    if (field.source === "html") {
      if (field.selector.includes(":contains(")) {
        return this.handleContainsSelector($, field);
      }

      const elements = $(field.selector);
      
      if (field.process === "extract_text") {
        const element = elements.first();
        if (element.length === 0) return "Unknown";
        const value = element.text().trim();
        return this.postProcess(value, field.post_process);
      }

      if (field.process === "extract_items") {
        return this.extractItems($, elements, field);
      }
    }

    return "Unknown";
  }

  private handleContainsSelector($: cheerio.CheerioAPI, field: any): any {
    const [preContains, rest] = field.selector.split(":contains('");
    const [containsText, postContains] = rest.split("')", 1);
    
    const elements = $(preContains);
    let targetElement: cheerio.Cheerio<cheerio.Element> | null = null;
    
    elements.each((_, elem) => {
      if ($(elem).text().includes(containsText)) {
        targetElement = $(elem);
        return false; // break
      }
    });

    if (!targetElement) return "Unknown";

    if (postContains && postContains.trim()) {
      targetElement = targetElement.find(postContains.trim());
    }

    if (targetElement.length === 0) return "Unknown";

    const value = targetElement.text().trim();
    return this.postProcess(value, field.post_process);
  }

  private extractItems($: cheerio.CheerioAPI, elements: cheerio.Cheerio<cheerio.Element>, field: any): [any[], { [key: string]: any }] {
    const items: any[] = [];
    const specialValues: { [key: string]: any } = {};

    elements.each((_, elem) => {
      const itemData: { [key: string]: any } = {};
      
      for (const subfield of field.subfields || []) {
        const subElement = $(elem).find(subfield.selector);
        itemData[subfield.name] = subElement.length > 0 ? subElement.text().trim() : "Unknown";
      }

      // Check if all required subfields are present
      if (field.subfield_order) {
        const allPresent = field.subfield_order.every((name: string) => 
          itemData[name] && itemData[name] !== "Unknown"
        );
        if (!allPresent) return; // continue to next item
      }

      // Check for special values
      if (field.special_values) {
        for (const sv of field.special_values) {
          const subfieldToCheck = sv.subfield;
          if (itemData[subfieldToCheck] === sv.value) {
            let extractValue = itemData[sv.extract_subfield];
            if (sv.post_process) {
              extractValue = this.postProcess(extractValue, sv.post_process);
            }
            specialValues[sv.name] = extractValue;
          }
        }
      }

      // Build item tuple
      if (field.subfield_order) {
        const itemTuple = field.subfield_order.map((name: string) => itemData[name] || "Unknown");
        items.push(itemTuple);
      } else {
        items.push(Object.values(itemData));
      }
    });

    return [items, specialValues];
  }

  private postProcess(value: string, postProcess?: string): string {
    if (!postProcess || typeof value !== 'string') return value;

    try {
      // Simple post-processing implementation
      if (postProcess === 'upper()') return value.toUpperCase();
      if (postProcess === 'lower()') return value.toLowerCase();
      if (postProcess === 'strip()') return value.trim();
      if (postProcess.startsWith('replace(')) {
        const match = postProcess.match(/replace\('([^']+)',\s*'([^']*)'\)/);
        if (match) {
          return value.replace(new RegExp(match[1], 'g'), match[2]);
        }
      }
      return value;
    } catch (error) {
      console.error(`Post-processing failed: ${postProcess}`, error);
      return value;
    }
  }

  validateRequiredFields(extractedData: ExtractedData, requiredFields: string[]): boolean {
    return requiredFields.every(field => 
      extractedData[field] && extractedData[field] !== "Unknown"
    );
  }
}

export const emailProcessor = new EmailProcessor();
