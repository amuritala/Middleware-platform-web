interface StatCardProps {
  title: string;
  value: string;
  change: number;
}

export default function StatCard({ title, value, change }: StatCardProps) {
  const isNegative = change < 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-sm text-gray-500">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          isNegative ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"
        }`}>
          <svg className={`w-3 h-3 ${isNegative ? "rotate-90" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          {isNegative ? "" : "+"}{change}%
        </span>
      </div>
    </div>
  );
}
