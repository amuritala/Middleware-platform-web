interface Transaction {
  name: string;
  date: string;
  amount: string;
  account: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Transaction</h3>
        <button className="text-sm text-gray-500 hover:text-gray-700">See all</button>
      </div>

      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Account</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-3 text-sm font-medium text-gray-900">{tx.name}</td>
                <td className="py-3 text-sm text-gray-500">{tx.date}</td>
                <td className="py-3 text-sm font-semibold text-gray-900">{tx.amount}</td>
                <td className="py-3 text-sm text-gray-500">{tx.account}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
