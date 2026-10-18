interface TeamPaymentsCardProps {
  title: string;
  date: string;
  memberCount: number;
}

export default function TeamPaymentsCard({ title, date, memberCount }: TeamPaymentsCardProps) {
  const avatarColors = ["bg-orange-400", "bg-purple-500", "bg-blue-500", "bg-pink-500", "bg-green-500"];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {date}
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
        </button>
      </div>

      <div className="flex items-center mt-4">
        <div className="flex -space-x-3">
          {avatarColors.slice(0, Math.min(memberCount, 5)).map((color, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        {memberCount > 5 && (
          <span className="ml-3 text-sm text-gray-500 font-medium">+{memberCount - 5}</span>
        )}
      </div>
    </div>
  );
}
