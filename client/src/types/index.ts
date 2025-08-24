export interface User {
  id: string;
  username: string;
  email: string;
  gmailTokens?: any;
}

export interface ProcessingRule {
  id: string;
  name: string;
  pattern: string;
  fields: any[];
  outputTemplate: string;
  requiredFields?: string[];
  isActive: boolean;
}

export interface EmailProcessingResult {
  id: string;
  emailId: string;
  subject?: string;
  sender?: string;
  processedAt: string;
  extractedData: any;
  pdfPath?: string;
  status: string;
  errorMessage?: string;
}

export interface ProcessingJob {
  id: string;
  query: string;
  dateRange?: string;
  emailType?: string;
  status: string;
  totalEmails: number;
  processedEmails: number;
  successfulEmails: number;
  failedEmails: number;
  createdAt: string;
  completedAt?: string;
}

export interface ProcessingStats {
  totalProcessed: number;
  totalAmount: number;
  uberTrips: number;
  uberEatsOrders: number;
}

export interface SearchEmailsRequest {
  query: string;
  dateRange?: string;
  emailType?: string;
}
