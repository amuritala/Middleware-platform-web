interface PricingCardProps {
  price: string;
  period: string;
  title: string;
  buttonText: string;
}

export default function PricingCard({ price, period, title, buttonText }: PricingCardProps) {
  return (
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-3xl font-bold">{price}</span>
            <p className="text-sm text-white/80 mt-1">{period}</p>
          </div>
          <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        <h3 className="text-xl font-semibold mt-6">{title}</h3>

        <button className="w-full mt-4 py-3 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors">
          {buttonText}
        </button>
      </div>
    </div>
  );
}
