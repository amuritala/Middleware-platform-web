const currencies = [
  { name: "Euro", amount: "€40,000", color: "from-blue-400 to-blue-500" },
  { name: "Naira", amount: "₦30,000", color: "from-orange-400 to-orange-500" },
  { name: "Dollar", amount: "$20,000", color: "from-purple-400 to-pink-400" },
];

export default function WalletCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="relative h-32 mb-4">
        {currencies.map((currency, i) => (
          <div
            key={currency.name}
            className={`absolute left-0 right-0 bg-gradient-to-r ${currency.color} text-white px-4 py-2 rounded-xl flex items-center justify-between`}
            style={{ top: `${i * 36}px`, zIndex: i }}
          >
            <span className="text-sm font-medium">{currency.name}</span>
            <span className="text-sm font-semibold">{currency.amount}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">4 cards</span>
        <button className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-400">Wallet balance</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">$14,765.00</span>
          <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+32.8%</span>
        </div>
      </div>
    </div>
  );
}
