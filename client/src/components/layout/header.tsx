import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  isConnected: boolean;
  onNewSearch?: () => void;
  onConnect?: () => void;
}

export function Header({ title, subtitle, isConnected, onNewSearch, onConnect }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900" data-testid="header-title">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 mt-1" data-testid="header-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Gmail Connection Status */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            isConnected ? "bg-green-50" : "bg-red-50"
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}></div>
            <span className={`text-sm font-medium ${
              isConnected ? "text-green-700" : "text-red-700"
            }`} data-testid="connection-status">
              {isConnected ? "Gmail Connected" : "Gmail Disconnected"}
            </span>
          </div>
          
          {isConnected && onNewSearch && (
            <Button 
              onClick={onNewSearch}
              className="bg-primary-500 hover:bg-primary-600"
              data-testid="button-new-search"
            >
              <i className="fas fa-plus mr-2"></i>
              New Search
            </Button>
          )}
          
          {!isConnected && onConnect && (
            <Button 
              onClick={onConnect}
              className="bg-primary-500 hover:bg-primary-600"
              data-testid="button-connect-gmail"
            >
              <i className="fab fa-google mr-2"></i>
              Connect Gmail
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
