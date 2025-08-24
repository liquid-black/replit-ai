import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/api/auth/gmail/callback`
    );

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  getAuthUrl(): string {
    const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
    
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  async refreshTokenIfNeeded() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      return credentials;
    } catch (error) {
      throw new Error('Failed to refresh access token');
    }
  }

  async searchEmails(query: string, maxResults = 100): Promise<any[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      const messages = response.data.messages || [];
      const emailDetails = [];

      for (const message of messages) {
        try {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });
          emailDetails.push(detail.data);
        } catch (error) {
          console.error(`Failed to fetch email ${message.id}:`, error);
        }
      }

      return emailDetails;
    } catch (error) {
      console.error('Failed to search emails:', error);
      throw error;
    }
  }

  async getEmailById(emailId: string): Promise<any> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full'
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch email ${emailId}:`, error);
      throw error;
    }
  }

  extractHeaders(email: any): { [key: string]: string } {
    const headers: { [key: string]: string } = {};
    if (email.payload?.headers) {
      email.payload.headers.forEach((header: any) => {
        headers[header.name] = header.value;
      });
    }
    return headers;
  }

  extractHtmlBody(email: any): string {
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
}

export const gmailService = new GmailService();
