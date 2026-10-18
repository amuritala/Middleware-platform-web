interface Transaction {
  company: string;
  amount: string;
  status: string;
  icon: string;
  iconBg: string;
}

interface TransactionsCardProps {
  title: string;
  transactions: Transaction[];
}

export default function TransactionsCard({ title, transactions }: TransactionsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {transactions.map((tx, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${tx.iconBg} rounded-full flex items-center justify-center`}>
                {tx.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{tx.company}</p>
                <p className="text-xs text-gray-400">{tx.status}</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-900">{tx.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
