interface IncomeStatsCardProps {
  title: string;
  change: number;
  bars: number[];
}

export default function IncomeStatsCard({ title, change, bars }: IncomeStatsCardProps) {
  const maxBar = Math.max(...bars);
  const barColors = ["bg-gray-900", "bg-teal-400", "bg-purple-300", "bg-orange-400"];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full mt-2">
            <svg className="w-3 h-3 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            {change}%
          </span>
        </div>
        <button className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="flex items-end gap-3 h-32 mt-6">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className={`w-full rounded-full ${barColors[i % barColors.length]}`}
              style={{ height: `${(bar / maxBar) * 100}%` }}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-4 text-xs text-gray-400">
        <span>$0</span>
        <span>$5</span>
        <span>$10</span>
      </div>
    </div>
  );
}
