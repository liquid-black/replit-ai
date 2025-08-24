interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: string;
    label: string;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, icon, iconBgColor, iconColor, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-material p-6" data-testid={`stats-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900" data-testid={`stats-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <i className={`${icon} ${iconColor} text-xl`}></i>
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
          <span className="text-gray-500 ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
