interface SalesChartCardProps {
  title: string;
  date: string;
  totalProfit: string;
  netValue: string;
  totalCost: string;
  invested: string;
  chartData: number[];
  tooltipValue: string;
}

export default function SalesChartCard({
  title,
  date,
  totalProfit,
  netValue,
  totalCost,
  invested,
  chartData,
  tooltipValue,
}: SalesChartCardProps) {
  const maxBar = Math.max(...chartData);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          {date}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="flex gap-8">
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Profit</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalProfit}</p>
                <p className="text-xs text-gray-400 mt-1">Net Value {netValue}</p>
              </div>
              <button className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalCost}</p>
                <p className="text-xs text-gray-400 mt-1">{invested}</p>
              </div>
              <button className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="flex items-end gap-2 h-48">
            {chartData.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                {i === 3 && (
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded mb-1 whitespace-nowrap">
                    {tooltipValue}
                  </div>
                )}
                <div
                  className="w-full bg-gradient-to-t from-orange-200 to-orange-300 rounded-t-lg"
                  style={{ height: `${(bar / maxBar) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-400">
            <span>$0</span>
            <span>$30</span>
            <span>$50</span>
            <span>$70</span>
            <span>$100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
