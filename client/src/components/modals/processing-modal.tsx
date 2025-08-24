import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ProcessingJob } from "../../types";

interface ProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: ProcessingJob;
}

export function ProcessingModal({ isOpen, onClose, job }: ProcessingModalProps) {
  const getProgress = () => {
    if (!job || job.totalEmails === 0) return 0;
    return (job.processedEmails / job.totalEmails) * 100;
  };

  const getStatusText = () => {
    if (!job) return "Initializing...";
    
    switch (job.status) {
      case "pending":
        return "Preparing to search emails...";
      case "processing":
        return "Processing emails...";
      case "completed":
        return "Processing completed!";
      case "failed":
        return "Processing failed";
      default:
        return "Processing...";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Processing Emails
            {job?.status === "processing" && (
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4" data-testid="processing-modal-content">
          <div className="flex items-center space-x-3">
            {job?.status === "completed" ? (
              <i className="fas fa-check-circle text-green-500 text-xl"></i>
            ) : job?.status === "failed" ? (
              <i className="fas fa-exclamation-circle text-red-500 text-xl"></i>
            ) : (
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            )}
            <span className="text-gray-700" data-testid="status-text">{getStatusText()}</span>
          </div>
          
          <Progress value={getProgress()} className="w-full" />
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>Found <span className="font-medium" data-testid="emails-found">{job?.totalEmails || 0}</span> emails</p>
            <p>Processed <span className="font-medium" data-testid="emails-processed">{job?.processedEmails || 0}</span> of <span className="font-medium">{job?.totalEmails || 0}</span></p>
            {job && job.processedEmails > 0 && (
              <>
                <p className="text-green-600">Successful: <span className="font-medium">{job.successfulEmails}</span></p>
                <p className="text-red-600">Failed: <span className="font-medium">{job.failedEmails}</span></p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
