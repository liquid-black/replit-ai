import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchEmailsRequest } from "../../types";

interface SearchFormProps {
  onSubmit: (data: SearchEmailsRequest) => void;
  onPreview?: () => void;
  isLoading?: boolean;
}

export function SearchForm({ onSubmit, onPreview, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState("Your Instacart");
  const [dateRange, setDateRange] = useState("last30days");
  const [emailType, setEmailType] = useState("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ query, dateRange, emailType });
  };

  return (
    <div className="bg-white rounded-xl shadow-material p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Process Emails</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </Label>
          <div className="relative">
            <Input
              id="query"
              type="text"
              placeholder="Enter email subject or sender (e.g., 'Your Uber receipt', 'Uber Eats')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-query"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger data-testid="select-date-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
                <SelectItem value="last3months">Last 3 months</SelectItem>
                <SelectItem value="last6months">Last 6 months</SelectItem>
                <SelectItem value="lastyear">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="emailType" className="block text-sm font-medium text-gray-700 mb-2">
              Email Type
            </Label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger data-testid="select-email-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All receipts</SelectItem>
                <SelectItem value="uber">Uber trips only</SelectItem>
                <SelectItem value="ubereats">Uber Eats only</SelectItem>
                <SelectItem value="instacart">Instacart only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-primary-500 hover:bg-primary-600"
            data-testid="button-search-emails"
          >
            <i className="fas fa-search mr-2"></i>
            {isLoading ? "Processing..." : "Search Emails"}
          </Button>
          {onPreview && (
            <Button 
              type="button" 
              variant="outline"
              onClick={onPreview}
              data-testid="button-preview"
            >
              <i className="fas fa-eye mr-2"></i>
              Preview
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
