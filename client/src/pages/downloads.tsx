import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { EmailProcessingResult } from "../types";

export default function Downloads() {
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["/api/results"],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const extractServiceFromSubject = (subject: string) => {
    if (subject?.toLowerCase().includes('uber eats')) return 'Uber Eats';
    if (subject?.toLowerCase().includes('uber')) return 'Uber';
    if (subject?.toLowerCase().includes('instacart')) return 'Instacart';
    return 'Unknown';
  };

  const extractAmount = (extractedData: any) => {
    return extractedData?.amount || extractedData?.total_amount || extractedData?.total || 'N/A';
  };

  const handleDownloadPDF = (resultId: string) => {
    api.downloadPDF(resultId);
  };

  const handleExportCSV = () => {
    api.exportCSV();
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Downloads"
        subtitle="Download processed receipts and export data"
        isConnected={true}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Export Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
                  <p className="text-gray-600">Export all your processed data in various formats</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleExportCSV}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-export-all-csv"
                  >
                    <i className="fas fa-file-csv mr-2"></i>
                    Export All as CSV
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    data-testid="button-export-all-pdf"
                  >
                    <i className="fas fa-file-pdf mr-2"></i>
                    Export All as PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Downloads List */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Individual Downloads</h3>
                <div className="text-sm text-gray-600">
                  {results.length} files available
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-download text-4xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Downloads Available</h3>
                  <p className="text-gray-600">
                    Process some emails first to generate downloadable files.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 rounded-lg">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Processed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result: EmailProcessingResult) => {
                        const service = extractServiceFromSubject(result.subject || '');
                        const amount = extractAmount(result.extractedData);
                        const fileName = result.pdfPath ? 
                          result.pdfPath.split('/').pop() || 'receipt.pdf' : 
                          'receipt.pdf';

                        return (
                          <tr key={result.id} className="hover:bg-gray-50" data-testid={`download-row-${result.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <i className="fas fa-file-pdf text-red-500 mr-3"></i>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {fileName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {result.subject}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{service}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(result.processedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                                {result.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                {result.pdfPath && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadPDF(result.id)}
                                    data-testid={`button-download-pdf-${result.id}`}
                                  >
                                    <i className="fas fa-download mr-1"></i>
                                    Download
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-view-details-${result.id}`}
                                >
                                  <i className="fas fa-eye mr-1"></i>
                                  View
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-file-pdf text-blue-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">PDF Files</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {results.filter(r => r.pdfPath).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-check-circle text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Successful</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {results.filter(r => r.status === 'success').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-hdd text-gray-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Size</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ~{(results.length * 45).toFixed(0)} KB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
