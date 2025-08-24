import { Button } from "@/components/ui/button";
import { EmailProcessingResult } from "../../types";

interface ResultsTableProps {
  results: EmailProcessingResult[];
  onExportCSV: () => void;
  onExportPDF: () => void;
  onViewResult: (result: EmailProcessingResult) => void;
  onDownloadPDF: (resultId: string) => void;
}

export function ResultsTable({ 
  results, 
  onExportCSV, 
  onExportPDF, 
  onViewResult, 
  onDownloadPDF 
}: ResultsTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const extractServiceFromSubject = (subject: string) => {
    if (subject?.toLowerCase().includes('uber eats')) return 'Uber Eats';
    if (subject?.toLowerCase().includes('uber')) return 'Uber';
    if (subject?.toLowerCase().includes('instacart')) return 'Instacart';
    return 'Unknown';
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Uber': return 'U';
      case 'Uber Eats': return 'fas fa-utensils';
      case 'Instacart': return 'I';
      default: return '?';
    }
  };

  const getServiceColor = (service: string) => {
    switch (service) {
      case 'Uber': return 'bg-black text-white';
      case 'Uber Eats': return 'bg-green-600 text-white';
      case 'Instacart': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const extractAmount = (extractedData: any) => {
    return extractedData?.amount || extractedData?.total_amount || extractedData?.total || 'N/A';
  };

  const extractLocations = (extractedData: any) => {
    const from = extractedData?.pickup_location || extractedData?.restaurant || 'N/A';
    const to = extractedData?.dropoff_location || extractedData?.delivery_address || 'N/A';
    return { from, to };
  };

  return (
    <div className="bg-white rounded-xl shadow-material">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Processing Results</h3>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onExportCSV}
              variant="outline"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              data-testid="button-export-csv"
            >
              <i className="fas fa-file-csv mr-2"></i>
              Export CSV
            </Button>
            <Button
              onClick={onExportPDF}
              variant="outline"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              data-testid="button-export-pdf"
            >
              <i className="fas fa-file-pdf mr-2"></i>
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result) => {
              const service = extractServiceFromSubject(result.subject || '');
              const serviceIcon = getServiceIcon(service);
              const serviceColor = getServiceColor(service);
              const amount = extractAmount(result.extractedData);
              const { from, to } = extractLocations(result.extractedData);

              return (
                <tr key={result.id} className="hover:bg-gray-50" data-testid={`result-row-${result.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(result.processedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 ${serviceColor} rounded-lg flex items-center justify-center mr-3`}>
                        {serviceIcon.startsWith('fas') ? (
                          <i className={`${serviceIcon} text-xs`}></i>
                        ) : (
                          <span className="text-xs font-bold">{serviceIcon}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{service}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service === 'Uber Eats' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {service === 'Uber Eats' ? 'Food' : 'Trip'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                    {from}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                    {to}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => onViewResult(result)}
                        className="text-blue-600 hover:text-blue-900"
                        data-testid={`button-view-${result.id}`}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {result.pdfPath && (
                        <button 
                          onClick={() => onDownloadPDF(result.id)}
                          className="text-green-600 hover:text-green-900"
                          data-testid={`button-download-${result.id}`}
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {results.length === 0 && (
        <div className="px-6 py-12 text-center">
          <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">No processing results found</p>
          <p className="text-gray-400 text-sm">Start by searching and processing emails</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(results.length, 20)}</span> of <span className="font-medium">{results.length}</span> results
            </p>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-100" data-testid="button-previous">
                Previous
              </button>
              <button className="px-3 py-1 bg-primary-500 text-white rounded-md text-sm hover:bg-primary-600" data-testid="button-page-1">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-100" data-testid="button-next">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
