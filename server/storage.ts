import { 
  type User, 
  type InsertUser, 
  type ProcessingRule, 
  type InsertProcessingRule,
  type EmailProcessingResult,
  type InsertEmailProcessingResult,
  type ProcessingJob,
  type InsertProcessingJob
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Processing rules methods
  getProcessingRules(userId: string): Promise<ProcessingRule[]>;
  getProcessingRule(id: string): Promise<ProcessingRule | undefined>;
  createProcessingRule(rule: InsertProcessingRule & { userId: string }): Promise<ProcessingRule>;
  updateProcessingRule(id: string, updates: Partial<ProcessingRule>): Promise<ProcessingRule>;
  deleteProcessingRule(id: string): Promise<void>;

  // Email processing results methods
  getEmailProcessingResults(userId: string, limit?: number): Promise<EmailProcessingResult[]>;
  createEmailProcessingResult(result: InsertEmailProcessingResult): Promise<EmailProcessingResult>;
  getProcessingStats(userId: string): Promise<{
    totalProcessed: number;
    totalAmount: number;
    uberTrips: number;
    uberEatsOrders: number;
  }>;

  // Processing jobs methods
  getProcessingJobs(userId: string): Promise<ProcessingJob[]>;
  getProcessingJob(id: string): Promise<ProcessingJob | undefined>;
  createProcessingJob(job: InsertProcessingJob & { userId: string }): Promise<ProcessingJob>;
  updateProcessingJob(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private processingRules: Map<string, ProcessingRule>;
  private emailProcessingResults: Map<string, EmailProcessingResult>;
  private processingJobs: Map<string, ProcessingJob>;

  constructor() {
    this.users = new Map();
    this.processingRules = new Map();
    this.emailProcessingResults = new Map();
    this.processingJobs = new Map();

    // Initialize with default rules
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    const defaultUserId = "default-user";
    
    // Create default user
    const defaultUser: User = {
      id: defaultUserId,
      username: "demo",
      password: "demo",
      email: "demo@example.com",
      gmailTokens: null,
      createdAt: new Date(),
    };
    this.users.set(defaultUserId, defaultUser);

    // Uber receipt rule
    const uberRule: ProcessingRule = {
      id: randomUUID(),
      userId: defaultUserId,
      name: "Uber Receipts",
      pattern: "Your Uber receipt",
      fields: [
        {
          name: "trip_date",
          source: "html",
          selector: ".trip-date",
          process: "extract_text"
        },
        {
          name: "amount",
          source: "html", 
          selector: ".total-amount",
          process: "extract_text"
        },
        {
          name: "pickup_location",
          source: "html",
          selector: ".pickup-address",
          process: "extract_text"
        },
        {
          name: "dropoff_location",
          source: "html",
          selector: ".dropoff-address", 
          process: "extract_text"
        }
      ],
      outputTemplate: "uber_{trip_date}_{amount}.pdf",
      requiredFields: ["trip_date", "amount"],
      pdfSections: [],
      isActive: true,
      createdAt: new Date(),
    };

    // Uber Eats rule
    const uberEatsRule: ProcessingRule = {
      id: randomUUID(),
      userId: defaultUserId,
      name: "Uber Eats",
      pattern: "Your Uber Eats order",
      fields: [
        {
          name: "order_date",
          source: "html",
          selector: ".order-date",
          process: "extract_text"
        },
        {
          name: "total_amount",
          source: "html",
          selector: ".total",
          process: "extract_text"
        },
        {
          name: "restaurant",
          source: "html",
          selector: ".restaurant-name",
          process: "extract_text"
        },
        {
          name: "delivery_address",
          source: "html",
          selector: ".delivery-address",
          process: "extract_text"
        }
      ],
      outputTemplate: "ubereats_{order_date}_{total_amount}.pdf",
      requiredFields: ["order_date", "total_amount"],
      pdfSections: [],
      isActive: true,
      createdAt: new Date(),
    };

    this.processingRules.set(uberRule.id, uberRule);
    this.processingRules.set(uberEatsRule.id, uberEatsRule);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      gmailTokens: null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getProcessingRules(userId: string): Promise<ProcessingRule[]> {
    return Array.from(this.processingRules.values()).filter(rule => rule.userId === userId);
  }

  async getProcessingRule(id: string): Promise<ProcessingRule | undefined> {
    return this.processingRules.get(id);
  }

  async createProcessingRule(rule: InsertProcessingRule & { userId: string }): Promise<ProcessingRule> {
    const id = randomUUID();
    const processingRule: ProcessingRule = {
      ...rule,
      id,
      createdAt: new Date(),
    };
    this.processingRules.set(id, processingRule);
    return processingRule;
  }

  async updateProcessingRule(id: string, updates: Partial<ProcessingRule>): Promise<ProcessingRule> {
    const rule = this.processingRules.get(id);
    if (!rule) throw new Error("Processing rule not found");
    
    const updatedRule = { ...rule, ...updates };
    this.processingRules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteProcessingRule(id: string): Promise<void> {
    this.processingRules.delete(id);
  }

  async getEmailProcessingResults(userId: string, limit = 50): Promise<EmailProcessingResult[]> {
    return Array.from(this.emailProcessingResults.values())
      .filter(result => result.userId === userId)
      .sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime())
      .slice(0, limit);
  }

  async createEmailProcessingResult(result: InsertEmailProcessingResult): Promise<EmailProcessingResult> {
    const id = randomUUID();
    const emailResult: EmailProcessingResult = {
      ...result,
      id,
      processedAt: new Date(),
    };
    this.emailProcessingResults.set(id, emailResult);
    return emailResult;
  }

  async getProcessingStats(userId: string): Promise<{
    totalProcessed: number;
    totalAmount: number;
    uberTrips: number;
    uberEatsOrders: number;
  }> {
    const results = await this.getEmailProcessingResults(userId);
    
    let totalAmount = 0;
    let uberTrips = 0;
    let uberEatsOrders = 0;

    results.forEach(result => {
      const data = result.extractedData as any;
      
      // Extract amount
      if (data.amount || data.total_amount) {
        const amountStr = data.amount || data.total_amount;
        const amount = parseFloat(amountStr.toString().replace(/[^0-9.]/g, ''));
        if (!isNaN(amount)) {
          totalAmount += amount;
        }
      }

      // Count by type
      if (result.subject?.includes('Uber') && !result.subject?.includes('Eats')) {
        uberTrips++;
      } else if (result.subject?.includes('Uber Eats')) {
        uberEatsOrders++;
      }
    });

    return {
      totalProcessed: results.length,
      totalAmount,
      uberTrips,
      uberEatsOrders,
    };
  }

  async getProcessingJobs(userId: string): Promise<ProcessingJob[]> {
    return Array.from(this.processingJobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProcessingJob(id: string): Promise<ProcessingJob | undefined> {
    return this.processingJobs.get(id);
  }

  async createProcessingJob(job: InsertProcessingJob & { userId: string }): Promise<ProcessingJob> {
    const id = randomUUID();
    const processingJob: ProcessingJob = {
      ...job,
      id,
      createdAt: new Date(),
      completedAt: null,
    };
    this.processingJobs.set(id, processingJob);
    return processingJob;
  }

  async updateProcessingJob(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob> {
    const job = this.processingJobs.get(id);
    if (!job) throw new Error("Processing job not found");
    
    const updatedJob = { ...job, ...updates };
    if (updates.status === "completed" || updates.status === "failed") {
      updatedJob.completedAt = new Date();
    }
    
    this.processingJobs.set(id, updatedJob);
    return updatedJob;
  }
}

export const storage = new MemStorage();
