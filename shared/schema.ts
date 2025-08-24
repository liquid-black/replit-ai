import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  gmailTokens: jsonb("gmail_tokens"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const processingRules = pgTable("processing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  pattern: text("pattern").notNull(),
  fields: jsonb("fields").notNull(),
  outputTemplate: text("output_template").notNull(),
  requiredFields: jsonb("required_fields"),
  pdfSections: jsonb("pdf_sections"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailProcessingResults = pgTable("email_processing_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  ruleId: varchar("rule_id").references(() => processingRules.id),
  emailId: text("email_id").notNull(),
  subject: text("subject"),
  sender: text("sender"),
  processedAt: timestamp("processed_at").defaultNow(),
  extractedData: jsonb("extracted_data").notNull(),
  pdfPath: text("pdf_path"),
  status: text("status").notNull().default("success"),
  errorMessage: text("error_message"),
});

export const processingJobs = pgTable("processing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  query: text("query").notNull(),
  dateRange: text("date_range"),
  emailType: text("email_type"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  totalEmails: integer("total_emails").default(0),
  processedEmails: integer("processed_emails").default(0),
  successfulEmails: integer("successful_emails").default(0),
  failedEmails: integer("failed_emails").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertProcessingRuleSchema = createInsertSchema(processingRules).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertEmailProcessingResultSchema = createInsertSchema(emailProcessingResults).omit({
  id: true,
  processedAt: true,
});

export const insertProcessingJobSchema = createInsertSchema(processingJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ProcessingRule = typeof processingRules.$inferSelect;
export type InsertProcessingRule = z.infer<typeof insertProcessingRuleSchema>;

export type EmailProcessingResult = typeof emailProcessingResults.$inferSelect;
export type InsertEmailProcessingResult = z.infer<typeof insertEmailProcessingResultSchema>;

export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;

// API schemas
export const searchEmailsSchema = z.object({
  query: z.string(),
  dateRange: z.string().optional(),
  emailType: z.string().optional(),
});

export const gmailAuthSchema = z.object({
  code: z.string(),
});

export type SearchEmailsRequest = z.infer<typeof searchEmailsSchema>;
export type GmailAuthRequest = z.infer<typeof gmailAuthSchema>;
