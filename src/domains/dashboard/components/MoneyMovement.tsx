interface MoneyMovementProps {
  moneyIn: string;
  moneyOut: string;
  date: string;
}

export default function MoneyMovement({ moneyIn, moneyOut, date }: MoneyMovementProps) {
  const barData = [30, 45, 35, 50, 40, 60, 55, 45, 50, 65, 55, 70];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Money movement</h3>
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          Last 30 days
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400">Money in</p>
          <p className="text-lg font-bold text-gray-900">{moneyIn}</p>
        </div>
        <div className="bg-gray-100 px-3 py-1 rounded-full">
          <span className="text-xs text-gray-500">{date}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Money Out</p>
          <p className="text-lg font-bold text-gray-900">{moneyOut}</p>
        </div>
      </div>

      <div className="flex items-end gap-1 h-20">
        {barData.map((height, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t ${
              i === 9 ? "bg-orange-400" : "bg-blue-200"
            }`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
