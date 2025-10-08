import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gmailService } from "./services/gmail";
import { emailProcessor } from "./services/emailProcessor";
import { pdfGenerator } from "./services/pdfGenerator";
import { 
  searchEmailsSchema, 
  gmailAuthSchema,
  insertProcessingRuleSchema
} from "@shared/schema";
import { ValidationError } from "zod-validation-error";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Gmail OAuth routes
  app.get("/api/auth/gmail", async (req, res) => {
    try {
      const authUrl = gmailService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Gmail auth error:", error);
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  // OAuth callback route - Google redirects here with authorization code
  app.get("/api/auth/gmail/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        throw new Error("No authorization code received");
      }

      const tokens = await gmailService.getTokensFromCode(code);
      
      // For demo purposes, update the default user
      const defaultUser = await storage.getUserByUsername("demo");
      if (defaultUser) {
        await storage.updateUser(defaultUser.id, { gmailTokens: tokens });
      }
      
      // Return HTML page that closes the popup and notifies the parent
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Gmail Authorization Complete</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: #4CAF50; }
              .container { max-width: 400px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="success">✓ Gmail Connected Successfully!</h2>
              <p>You can close this window and return to the application.</p>
              <script>
                // Close popup and refresh parent window
                if (window.opener) {
                  window.opener.location.reload();
                  window.close();
                } else {
                  // If not in popup, redirect to home
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 2000);
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Gmail callback error:", error);
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Gmail Authorization Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #f44336; }
              .container { max-width: 400px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="error">✗ Authorization Failed</h2>
              <p>There was an error connecting to Gmail. Please try again.</p>
              <p><small>${error.message}</small></p>
              <script>
                setTimeout(() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    window.location.href = '/';
                  }
                }, 3000);
              </script>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Legacy POST callback for API clients
  app.post("/api/auth/gmail/callback", async (req, res) => {
    try {
      const { code } = gmailAuthSchema.parse(req.body);
      const tokens = await gmailService.getTokensFromCode(code);
      
      // For demo purposes, update the default user
      const defaultUser = await storage.getUserByUsername("demo");
      if (defaultUser) {
        await storage.updateUser(defaultUser.id, { gmailTokens: tokens });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Gmail callback error:", error);
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to process authorization" });
      }
    }
  });

  // Check Gmail connection status
  app.get("/api/gmail/status", async (req, res) => {
    try {
      const defaultUser = await storage.getUserByUsername("demo");
      const isConnected = defaultUser?.gmailTokens != null;
      res.json({ connected: isConnected, user: defaultUser?.email });
    } catch (error) {
      res.status(500).json({ error: "Failed to check Gmail status" });
    }
  });

  // Search and process emails
  app.post("/api/emails/search", async (req, res) => {
    try {
      const { query, dateRange, emailType } = searchEmailsSchema.parse(req.body);
      
      const defaultUser = await storage.getUserByUsername("demo");
      if (!defaultUser?.gmailTokens) {
        return res.status(401).json({ error: "Gmail not connected" });
      }

      gmailService.setCredentials(defaultUser.gmailTokens);

      // Build Gmail search query
      let gmailQuery = query;
      if (dateRange && dateRange !== "all") {
        const days = parseDateRange(dateRange);
        if (days) {
          gmailQuery += ` newer_than:${days}d`;
        }
      }

      const emails = await gmailService.searchEmails(gmailQuery, 50);
      
      // Create processing job
      const job = await storage.createProcessingJob({
        userId: defaultUser.id,
        query: gmailQuery,
        dateRange,
        emailType,
        status: "processing",
        totalEmails: emails.length,
        processedEmails: 0,
        successfulEmails: 0,
        failedEmails: 0,
      });

      // Process emails in background
      processEmailsInBackground(emails, defaultUser.id, job.id);

      res.json({ 
        jobId: job.id, 
        totalEmails: emails.length,
        message: "Processing started" 
      });

    } catch (error) {
      console.error("Email search error:", error);
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to search emails" });
      }
    }
  });

  // Get processing job status
  app.get("/api/jobs/:jobId", async (req, res) => {
    try {
      const job = await storage.getProcessingJob(req.params.jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to get job status" });
    }
  });

  // Get processing stats
  app.get("/api/stats", async (req, res) => {
    try {
      const defaultUser = await storage.getUserByUsername("demo");
      if (!defaultUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const stats = await storage.getProcessingStats(defaultUser.id);
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Get recent results
  app.get("/api/results", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const defaultUser = await storage.getUserByUsername("demo");
      if (!defaultUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const results = await storage.getEmailProcessingResults(defaultUser.id, limit);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to get results" });
    }
  });

  // Get processing rules
  app.get("/api/rules", async (req, res) => {
    try {
      const defaultUser = await storage.getUserByUsername("demo");
      if (!defaultUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const rules = await storage.getProcessingRules(defaultUser.id);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to get rules" });
    }
  });

  // Create processing rule
  app.post("/api/rules", async (req, res) => {
    try {
      const ruleData = insertProcessingRuleSchema.parse(req.body);
      const defaultUser = await storage.getUserByUsername("demo");
      if (!defaultUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const rule = await storage.createProcessingRule({
        ...ruleData,
        userId: defaultUser.id,
      });

      res.json(rule);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create rule" });
      }
    }
  });

  // Update processing rule
  app.put("/api/rules/:ruleId", async (req, res) => {
    try {
      const updates = insertProcessingRuleSchema.partial().parse(req.body);
      const rule = await storage.updateProcessingRule(req.params.ruleId, updates);
      res.json(rule);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to update rule" });
      }
    }
  });

  // Delete processing rule
  app.delete("/api/rules/:ruleId", async (req, res) => {
    try {
      await storage.deleteProcessingRule(req.params.ruleId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rule" });
    }
  });

  // Export CSV
  app.get("/api/export/csv", async (req, res) => {
    try {
      const defaultUser = await storage.getUserByUsername("demo");
      if (!defaultUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const results = await storage.getEmailProcessingResults(defaultUser.id);
      const csvPath = await pdfGenerator.generateCSV(results);
      
      res.download(csvPath, `email_results_${Date.now()}.csv`, (err) => {
        if (err) {
          console.error("Download error:", err);
        }
        // Clean up file after download
        fs.unlink(csvPath, () => {});
      });
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  // Download PDF
  app.get("/api/download/pdf/:resultId", async (req, res) => {
    try {
      const results = await storage.getEmailProcessingResults("default-user");
      const result = results.find(r => r.id === req.params.resultId);
      
      if (!result?.pdfPath || !fs.existsSync(result.pdfPath)) {
        return res.status(404).json({ error: "PDF not found" });
      }

      res.download(result.pdfPath, path.basename(result.pdfPath));
    } catch (error) {
      res.status(500).json({ error: "Failed to download PDF" });
    }
  });

  const httpServer = createServer(app);

  // Helper functions
  function parseDateRange(dateRange: string): number | null {
    switch (dateRange) {
      case "last7days": return 7;
      case "last30days": return 30;
      case "last3months": return 90;
      case "last6months": return 180;
      case "lastyear": return 365;
      default: return null;
    }
  }

  async function processEmailsInBackground(
    emails: any[], 
    userId: string, 
    jobId: string
  ) {
    try {
      const rules = await storage.getProcessingRules(userId);
      let processedCount = 0;
      let successCount = 0;
      let failedCount = 0;

      for (const email of emails) {
        try {
          const headers = gmailService.extractHeaders(email);
          const subject = headers.Subject || "";
          const sender = headers.From || "";

          // Find matching rule
          const matchingRule = rules.find(rule => 
            subject.includes(rule.pattern) || sender.includes(rule.pattern)
          );

          if (!matchingRule) {
            failedCount++;
            processedCount++;
            continue;
          }

          // Extract data
          const extractedData = emailProcessor.extractDataFromEmail(email, matchingRule);
          
          // Validate required fields
          const requiredFields = matchingRule.requiredFields as string[] || [];
          const isValid = emailProcessor.validateRequiredFields(extractedData, requiredFields);

          if (!isValid) {
            failedCount++;
            processedCount++;
            continue;
          }

          // Generate PDF
          const pdfPath = await pdfGenerator.generatePDF(extractedData, matchingRule, email);

          // Save result
          await storage.createEmailProcessingResult({
            userId,
            ruleId: matchingRule.id,
            emailId: email.id,
            subject,
            sender,
            extractedData,
            pdfPath,
            status: "success",
            errorMessage: null,
          });

          successCount++;
        } catch (error) {
          console.error("Failed to process email:", error);
          failedCount++;
        }
        
        processedCount++;

        // Update job progress
        await storage.updateProcessingJob(jobId, {
          processedEmails: processedCount,
          successfulEmails: successCount,
          failedEmails: failedCount,
        });
      }

      // Mark job as completed
      await storage.updateProcessingJob(jobId, {
        status: "completed",
        processedEmails: processedCount,
        successfulEmails: successCount,
        failedEmails: failedCount,
      });

    } catch (error) {
      console.error("Background processing error:", error);
      await storage.updateProcessingJob(jobId, {
        status: "failed",
      });
    }
  }

  return httpServer;
}
