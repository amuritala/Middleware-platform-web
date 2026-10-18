interface VendorStatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeColor?: "green" | "blue";
  icon: React.ReactNode;
  footerLeft: string;
  footerRight: string;
  footerRightColor?: "green" | "orange";
}

export default function VendorStatsCard({
  title,
  value,
  change,
  changeColor = "green",
  icon,
  footerLeft,
  footerRight,
  footerRightColor = "green",
}: VendorStatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 tracking-wide">{title}</p>
        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {change && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            changeColor === "green" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
          }`}>
            <svg className={`w-3 h-3 ${changeColor === "green" ? "" : "rotate-0"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {change}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{footerLeft}</span>
        <span className={`text-xs font-semibold ${
          footerRightColor === "green" ? "text-green-500" : "text-orange-500"
        }`}>
          {footerRight}
        </span>
      </div>
    </div>
  );
}
