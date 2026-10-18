interface SpendingLimitCardProps {
  limit: string;
  dateRange: string;
  amountSpent: string;
  budgetTotal: string;
}

export default function SpendingLimitCard({
  limit,
  dateRange,
  amountSpent,
  budgetTotal,
}: SpendingLimitCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-gray-500">Monthly spending limit</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{limit}</p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-3">{dateRange}</p>

      <div className="mt-4">
        <div className="flex gap-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < 28 ? "bg-blue-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-500">Amount Spent <span className="font-semibold text-gray-900">{amountSpent}</span></p>
        <p className="text-xs text-gray-400">Budget total <span className="font-medium text-gray-600">{budgetTotal}</span></p>
      </div>
    </div>
  );
}
