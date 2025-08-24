import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/cards/stats-card";
import { api } from "@/lib/api";

export default function Analytics() {
  const { data: gmailStatus } = useQuery({
    queryKey: ["/api/gmail/status"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: gmailStatus?.connected === true,
  });

  const { data: results = [] } = useQuery({
    queryKey: ["/api/results"],
    enabled: gmailStatus?.connected === true,
  });

  // Calculate analytics data
  const getMonthlyData = () => {
    const monthlyStats: { [key: string]: { count: number; amount: number } } = {};
    
    results.forEach((result: any) => {
      const date = new Date(result.processedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { count: 0, amount: 0 };
      }
      
      monthlyStats[monthKey].count++;
      
      const amount = parseFloat((result.extractedData?.amount || result.extractedData?.total_amount || '0').toString().replace(/[^0-9.]/g, ''));
      if (!isNaN(amount)) {
        monthlyStats[monthKey].amount += amount;
      }
    });

    return Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        ...data
      }));
  };

  const getServiceBreakdown = () => {
    const serviceStats: { [key: string]: { count: number; amount: number } } = {};
    
    results.forEach((result: any) => {
      const subject = result.subject || '';
      let service = 'Other';
      
      if (subject.toLowerCase().includes('uber eats')) {
        service = 'Uber Eats';
      } else if (subject.toLowerCase().includes('uber')) {
        service = 'Uber';
      } else if (subject.toLowerCase().includes('instacart')) {
        service = 'Instacart';
      }
      
      if (!serviceStats[service]) {
        serviceStats[service] = { count: 0, amount: 0 };
      }
      
      serviceStats[service].count++;
      
      const amount = parseFloat((result.extractedData?.amount || result.extractedData?.total_amount || '0').toString().replace(/[^0-9.]/g, ''));
      if (!isNaN(amount)) {
        serviceStats[service].amount += amount;
      }
    });

    return serviceStats;
  };

  const monthlyData = getMonthlyData();
  const serviceBreakdown = getServiceBreakdown();
  const isConnected = gmailStatus?.connected === true;

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col">
        <Header 
          title="Analytics"
          subtitle="View insights and trends from your email processing"
          isConnected={false}
        />
        <main className="flex-1 p-6 overflow-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <i className="fas fa-chart-bar text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gmail Not Connected</h3>
                <p className="text-gray-600">
                  Connect your Gmail account to view analytics and insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Analytics"
        subtitle="View insights and trends from your email processing"
        isConnected={isConnected}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Total Processed"
              value={stats?.totalProcessed || 0}
              icon="fas fa-envelope"
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatsCard
              title="Total Amount"
              value={stats?.totalAmount ? `$${stats.totalAmount.toFixed(2)}` : "$0.00"}
              icon="fas fa-dollar-sign"
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatsCard
              title="Average per Transaction"
              value={stats?.totalProcessed && stats?.totalAmount ? 
                `$${(stats.totalAmount / stats.totalProcessed).toFixed(2)}` : "$0.00"}
              icon="fas fa-calculator"
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
            <StatsCard
              title="This Month"
              value={monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].count : 0}
              icon="fas fa-calendar"
              iconBgColor="bg-orange-100"
              iconColor="text-orange-600"
            />
          </div>

          {/* Monthly Trends */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Trends</h3>
              {monthlyData.length > 0 ? (
                <div className="space-y-4">
                  {monthlyData.map((data, index) => (
                    <div key={data.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{data.month}</p>
                        <p className="text-sm text-gray-600">{data.count} transactions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${data.amount.toFixed(2)}</p>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-2 bg-primary-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.max(10, (data.count / Math.max(...monthlyData.map(d => d.count))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-chart-line text-3xl text-gray-300 mb-2"></i>
                  <p className="text-gray-500">No monthly data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Service Breakdown</h3>
                {Object.keys(serviceBreakdown).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(serviceBreakdown).map(([service, data]) => {
                      const percentage = stats?.totalProcessed ? 
                        (data.count / stats.totalProcessed * 100).toFixed(1) : '0';
                      
                      const getServiceColor = (serviceName: string) => {
                        switch (serviceName) {
                          case 'Uber': return 'bg-black';
                          case 'Uber Eats': return 'bg-green-600';
                          case 'Instacart': return 'bg-orange-500';
                          default: return 'bg-gray-500';
                        }
                      };

                      return (
                        <div key={service} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 ${getServiceColor(service)} rounded`}></div>
                            <span className="font-medium text-gray-900">{service}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{data.count} ({percentage}%)</p>
                            <p className="text-sm text-gray-600">${data.amount.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-pie-chart text-3xl text-gray-300 mb-2"></i>
                    <p className="text-gray-500">No service data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
                {results.length > 0 ? (
                  <div className="space-y-3">
                    {results.slice(0, 5).map((result: any) => {
                      const service = result.subject?.toLowerCase().includes('uber eats') ? 'Uber Eats' :
                                    result.subject?.toLowerCase().includes('uber') ? 'Uber' :
                                    result.subject?.toLowerCase().includes('instacart') ? 'Instacart' : 'Other';
                      const amount = result.extractedData?.amount || result.extractedData?.total_amount || 'N/A';
                      
                      return (
                        <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{service}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(result.processedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{amount}</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {result.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-clock text-3xl text-gray-300 mb-2"></i>
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Key Insights */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <i className="fas fa-trophy text-2xl text-blue-600 mb-2"></i>
                  <h4 className="font-semibold text-gray-900">Most Used Service</h4>
                  <p className="text-blue-600 font-medium">
                    {Object.keys(serviceBreakdown).length > 0 ? 
                      Object.entries(serviceBreakdown).reduce((a, b) => a[1].count > b[1].count ? a : b)[0] :
                      'No data'
                    }
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <i className="fas fa-chart-line text-2xl text-green-600 mb-2"></i>
                  <h4 className="font-semibold text-gray-900">Monthly Average</h4>
                  <p className="text-green-600 font-medium">
                    {monthlyData.length > 0 ? 
                      `$${(monthlyData.reduce((sum, d) => sum + d.amount, 0) / monthlyData.length).toFixed(2)}` :
                      '$0.00'
                    }
                  </p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <i className="fas fa-percent text-2xl text-purple-600 mb-2"></i>
                  <h4 className="font-semibold text-gray-900">Success Rate</h4>
                  <p className="text-purple-600 font-medium">
                    {results.length > 0 ? 
                      `${((results.filter((r: any) => r.status === 'success').length / results.length) * 100).toFixed(1)}%` :
                      '0%'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
