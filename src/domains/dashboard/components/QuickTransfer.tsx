interface QuickTransferProps {
  amount: string;
}

export default function QuickTransfer({ amount }: QuickTransferProps) {
  const contacts = [
    { name: "Add", isAdd: true },
    { name: "Sarah", color: "bg-orange-400" },
    { name: "Mike", color: "bg-blue-400" },
    { name: "Emma", color: "bg-purple-400" },
    { name: "John", color: "bg-green-400" },
    { name: "Lisa", color: "bg-pink-400" },
    { name: "Tom", color: "bg-teal-400" },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Quick transfer</h3>
        <button className="text-sm text-gray-500 hover:text-gray-700">See All Contacts</button>
      </div>

      <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2">
        {contacts.map((contact, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
            {contact.isAdd ? (
              <button className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            ) : (
              <div className={`w-12 h-12 rounded-full ${contact.color} flex items-center justify-center text-white font-bold text-sm`}>
                {contact.name[0]}
              </div>
            )}
          </div>
        ))}
        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-gray-900">{amount}</span>
        <button className="px-6 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors">
          Send
        </button>
      </div>
    </div>
  );
}
