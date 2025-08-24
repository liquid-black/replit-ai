import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isConnected: boolean;
  userEmail?: string;
  onSignOut: () => void;
}

export function Sidebar({ isConnected, userEmail, onSignOut }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    { href: "/", label: "Dashboard", icon: "fas fa-home" },
    { href: "/search", label: "Email Search", icon: "fas fa-search" },
    { href: "/rules", label: "Rules Config", icon: "fas fa-cogs" },
    { href: "/downloads", label: "Downloads", icon: "fas fa-file-download" },
    { href: "/analytics", label: "Analytics", icon: "fas fa-chart-bar" },
  ];

  return (
    <div className="w-64 bg-white shadow-material">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-envelope text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Receipt Processor</h1>
            <p className="text-sm text-gray-500">Gmail Integration</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a className={cn(
                  "flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
                  location === item.href
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-700 hover:bg-gray-100"
                )} data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}>
                  <i className={`${item.icon} w-5 h-5 mr-3`}></i>
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900" data-testid="user-email">
              {userEmail || "Not connected"}
            </span>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )}></div>
          </div>
          <button 
            onClick={onSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            data-testid="button-sign-out"
          >
            <i className="fas fa-sign-out-alt mr-1"></i>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
