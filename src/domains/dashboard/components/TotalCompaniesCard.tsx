export default function TotalCompaniesCard({ count }: { count?: number }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Total Companies</h3>
            <p className="text-xs text-gray-400">Global Portfolio</p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          All Regions
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl font-bold text-gray-900">{(count ?? 0).toLocaleString()}</span>
        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          +14.2%
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-gray-500">Enterprise (48%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-gray-500">Mid-Market (34%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-gray-500">SMBs (18%)</span>
        </div>
      </div>

      <div className="flex gap-1 h-2 mb-6">
        <div className="bg-orange-500 rounded-l-full" style={{ width: "48%" }} />
        <div className="bg-yellow-400" style={{ width: "34%" }} />
        <div className="bg-purple-500 rounded-r-full" style={{ width: "18%" }} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Active Companies</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">1,290</span>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Pending Onboarding</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">138</span>
            <div className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
