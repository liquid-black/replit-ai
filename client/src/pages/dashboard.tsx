import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/cards/stats-card";
import { SearchForm } from "@/components/forms/search-form";
import { ResultsTable } from "@/components/tables/results-table";
import { ProcessingModal } from "@/components/modals/processing-modal";
import { RuleConfigModal } from "@/components/modals/rule-config-modal";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { SearchEmailsRequest, ProcessingRule, EmailProcessingResult } from "../types";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { toast } = useToast();

  // Queries
  const { data: gmailStatus } = useQuery({
    queryKey: ["/api/gmail/status"],
    refetchInterval: 5000,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: gmailStatus?.connected === true,
  });

  const { data: results = [] } = useQuery({
    queryKey: ["/api/results"],
    enabled: gmailStatus?.connected === true,
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["/api/rules"],
    enabled: gmailStatus?.connected === true,
  });

  const { data: currentJob, refetch: refetchJob } = useQuery({
    queryKey: ["/api/jobs", currentJobId],
    enabled: !!currentJobId,
    refetchInterval: 2000,
  });

  // Mutations
  const connectGmailMutation = useMutation({
    mutationFn: api.getGmailAuthUrl,
    onSuccess: (data) => {
      window.open(data.authUrl, "_blank", "width=600,height=700");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initiate Gmail connection",
        variant: "destructive",
      });
    },
  });

  const searchEmailsMutation = useMutation({
    mutationFn: api.searchEmails,
    onSuccess: (data) => {
      setCurrentJobId(data.jobId);
      setIsProcessingModalOpen(true);
      toast({
        title: "Processing Started",
        description: `Found ${data.totalEmails} emails to process`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search emails",
        variant: "destructive",
      });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: api.createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Rule Created",
        description: "Processing rule has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create processing rule",
        variant: "destructive",
      });
    },
  });

  // Effects
  useEffect(() => {
    if (currentJob?.status === "completed" || currentJob?.status === "failed") {
      setIsProcessingModalOpen(false);
      setCurrentJobId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      if (currentJob.status === "completed") {
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${currentJob.successfulEmails} out of ${currentJob.totalEmails} emails`,
        });
      }
    }
  }, [currentJob, toast]);

  // Event handlers
  const handleConnectGmail = () => {
    connectGmailMutation.mutate();
  };

  const handleNewSearch = () => {
    // Could navigate to search page or open a modal
  };

  const handleSearchEmails = (data: SearchEmailsRequest) => {
    searchEmailsMutation.mutate(data);
  };

  const handleAddRule = () => {
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (rule: Omit<ProcessingRule, "id">) => {
    createRuleMutation.mutate(rule);
  };

  const handleExportCSV = () => {
    api.exportCSV();
  };

  const handleExportPDF = () => {
    toast({
      title: "Export",
      description: "PDF export feature coming soon",
    });
  };

  const handleViewResult = (result: EmailProcessingResult) => {
    toast({
      title: "Result Details",
      description: `Subject: ${result.subject}`,
    });
  };

  const handleDownloadPDF = (resultId: string) => {
    api.downloadPDF(resultId);
  };

  const isConnected = gmailStatus?.connected === true;

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Dashboard"
        subtitle="Process and extract financial data from your email receipts"
        isConnected={isConnected}
        onNewSearch={isConnected ? handleNewSearch : undefined}
        onConnect={!isConnected ? handleConnectGmail : undefined}
      />

      <main className="flex-1 p-6 overflow-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Processed"
            value={stats?.totalProcessed || 0}
            icon="fas fa-envelope"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            trend={{ value: "+12%", label: "from last month", isPositive: true }}
          />
          <StatsCard
            title="Total Amount"
            value={stats?.totalAmount ? `$${stats.totalAmount.toFixed(2)}` : "$0.00"}
            icon="fas fa-dollar-sign"
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            trend={{ value: "+8.2%", label: "from last month", isPositive: true }}
          />
          <StatsCard
            title="Uber Trips"
            value={stats?.uberTrips || 0}
            icon="fas fa-car"
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            trend={{ value: "+5", label: "this week", isPositive: true }}
          />
          <StatsCard
            title="Uber Eats Orders"
            value={stats?.uberEatsOrders || 0}
            icon="fas fa-utensils"
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            trend={{ value: "+18", label: "this week", isPositive: true }}
          />
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Search & Process */}
          <div className="lg:col-span-2">
            <SearchForm 
              onSubmit={handleSearchEmails}
              isLoading={searchEmailsMutation.isPending}
            />
          </div>

          {/* Rules Management */}
          <div className="bg-white rounded-xl shadow-material p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Rules</h3>
            
            <div className="space-y-4">
              {rules.map((rule: ProcessingRule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{rule.name}</p>
                      <p className="text-sm text-gray-500">{Array.isArray(rule.fields) ? rule.fields.length : 0} fields configured</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600" data-testid={`button-edit-rule-${rule.id}`}>
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={handleAddRule}
                className="w-full border-dashed border-2"
                data-testid="button-add-rule"
              >
                <i className="fas fa-plus mr-2"></i>
                Add New Rule
              </Button>

              <Button
                variant="outline"
                className="w-full"
                data-testid="button-upload-rules"
              >
                <i className="fas fa-upload mr-2"></i>
                Upload Rules JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Processing Results */}
        <ResultsTable
          results={results}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          onViewResult={handleViewResult}
          onDownloadPDF={handleDownloadPDF}
        />
      </main>

      {/* Modals */}
      <ProcessingModal
        isOpen={isProcessingModalOpen}
        onClose={() => setIsProcessingModalOpen(false)}
        job={currentJob}
      />

      <RuleConfigModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={handleSaveRule}
      />
    </div>
  );
}
