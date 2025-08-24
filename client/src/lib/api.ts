import { apiRequest } from "./queryClient";
import { SearchEmailsRequest, ProcessingRule } from "../types";

export const api = {
  // Gmail auth
  getGmailAuthUrl: async () => {
    const res = await apiRequest("GET", "/api/auth/gmail");
    return res.json();
  },

  processGmailCallback: async (code: string) => {
    const res = await apiRequest("POST", "/api/auth/gmail/callback", { code });
    return res.json();
  },

  getGmailStatus: async () => {
    const res = await apiRequest("GET", "/api/gmail/status");
    return res.json();
  },

  // Email processing
  searchEmails: async (data: SearchEmailsRequest) => {
    const res = await apiRequest("POST", "/api/emails/search", data);
    return res.json();
  },

  getJobStatus: async (jobId: string) => {
    const res = await apiRequest("GET", `/api/jobs/${jobId}`);
    return res.json();
  },

  // Stats and results
  getStats: async () => {
    const res = await apiRequest("GET", "/api/stats");
    return res.json();
  },

  getResults: async (limit?: number) => {
    const url = limit ? `/api/results?limit=${limit}` : "/api/results";
    const res = await apiRequest("GET", url);
    return res.json();
  },

  // Rules management
  getRules: async () => {
    const res = await apiRequest("GET", "/api/rules");
    return res.json();
  },

  createRule: async (rule: Omit<ProcessingRule, "id">) => {
    const res = await apiRequest("POST", "/api/rules", rule);
    return res.json();
  },

  updateRule: async (ruleId: string, updates: Partial<ProcessingRule>) => {
    const res = await apiRequest("PUT", `/api/rules/${ruleId}`, updates);
    return res.json();
  },

  deleteRule: async (ruleId: string) => {
    const res = await apiRequest("DELETE", `/api/rules/${ruleId}`);
    return res.json();
  },

  // Export
  exportCSV: () => {
    window.open("/api/export/csv", "_blank");
  },

  downloadPDF: (resultId: string) => {
    window.open(`/api/download/pdf/${resultId}`, "_blank");
  },
};
