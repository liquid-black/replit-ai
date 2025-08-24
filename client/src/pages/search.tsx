import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { SearchForm } from "@/components/forms/search-form";
import { ProcessingModal } from "@/components/modals/processing-modal";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { SearchEmailsRequest } from "../types";
import { useToast } from "@/hooks/use-toast";

export default function Search() {
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: gmailStatus } = useQuery({
    queryKey: ["/api/gmail/status"],
  });

  const { data: currentJob } = useQuery({
    queryKey: ["/api/jobs", currentJobId],
    enabled: !!currentJobId,
    refetchInterval: 2000,
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

  const handleSearchEmails = (data: SearchEmailsRequest) => {
    searchEmailsMutation.mutate(data);
  };

  const handlePreview = () => {
    toast({
      title: "Preview",
      description: "Email preview feature coming soon",
    });
  };

  const isConnected = gmailStatus?.connected === true;

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Email Search"
        subtitle="Search and process emails from your Gmail account"
        isConnected={isConnected}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {!isConnected && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gmail Not Connected</h3>
                  <p className="text-gray-600 mb-4">
                    You need to connect your Gmail account before you can search emails.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="lg:col-span-2">
            <SearchForm 
              onSubmit={handleSearchEmails}
              onPreview={handlePreview}
              isLoading={searchEmailsMutation.isPending}
            />
          </div>

          {/* Search Tips */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Common Search Patterns</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• "Your Uber receipt" - Uber trip receipts</li>
                    <li>• "Uber Eats" - Food delivery receipts</li>
                    <li>• "Your Instacart" - Grocery delivery receipts</li>
                    <li>• "from:noreply@uber.com" - All Uber emails</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Gmail Search Operators</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• from:email@domain.com - From specific sender</li>
                    <li>• subject:"exact phrase" - Exact subject match</li>
                    <li>• has:attachment - Emails with attachments</li>
                    <li>• after:2024/01/01 - After specific date</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ProcessingModal
        isOpen={isProcessingModalOpen}
        onClose={() => setIsProcessingModalOpen(false)}
        job={currentJob}
      />
    </div>
  );
}
