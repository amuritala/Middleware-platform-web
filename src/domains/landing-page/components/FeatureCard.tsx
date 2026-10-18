interface FeatureCardProps {
  number: string;
  category: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: "orange" | "blue" | "purple" | "green";
  iconBg: string;
  icon: React.ReactNode;
  footerTag: string;
  footerAction: string;
  footerActionColor: string;
  cardBg?: string;
  dark?: boolean;
}

const badgeDotColors = {
  orange: "bg-orange-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  green: "bg-emerald-500",
};

const categoryColors = {
  orange: "text-orange-500",
  blue: "text-blue-600",
  purple: "text-purple-600",
  green: "text-emerald-600",
};

/* Brighter variants of the same accents, for dark glassy cards. */
const darkAccents = {
  orange: "text-orange-300",
  blue: "text-blue-300",
  purple: "text-purple-300",
  green: "text-emerald-300",
};

/* Tinted translucent chips for the icon on dark cards. */
const darkIconBg = {
  orange: "bg-orange-500/20",
  blue: "bg-blue-500/20",
  purple: "bg-purple-500/20",
  green: "bg-emerald-500/20",
};

export default function FeatureCard({
  number,
  category,
  title,
  description,
  badge,
  badgeColor,
  iconBg,
  icon,
  footerTag,
  footerAction,
  footerActionColor,
  cardBg = "bg-white",
  dark = false,
}: FeatureCardProps) {
  const cardClass = dark
    ? "bg-white/[0.07] ring-1 ring-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
    : `${cardBg} shadow-[0_2px_15px_rgba(0,0,0,0.06)]`;

  return (
    <div
      className={`${cardClass} rounded-2xl p-4 flex flex-col gap-2`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`${
            dark ? darkIconBg[badgeColor] : iconBg
          } w-9 h-9 rounded-lg flex items-center justify-center`}
        >
          {icon}
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs font-medium ${
            dark ? "text-slate-200 bg-white/10" : "text-gray-600 bg-gray-50"
          } px-3 py-1.5 rounded-full`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${badgeDotColors[badgeColor]}`} />
          {badge}
        </span>
      </div>

      <p
        className={`text-xs font-semibold tracking-wide ${
          dark ? darkAccents[badgeColor] : categoryColors[badgeColor]
        }`}
      >
        {number} // {category}
      </p>
      <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-gray-900"}`}>
        {title}
      </h3>
      <p className={`text-xs leading-relaxed ${dark ? "text-slate-400" : "text-gray-500"}`}>
        {description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-3">
        <span className={`flex items-center gap-1.5 text-xs ${dark ? "text-slate-400" : "text-gray-500"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badgeDotColors[badgeColor]}`} />
          {footerTag}
        </span>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className={`text-xs font-medium ${
            dark ? darkAccents[badgeColor] : footerActionColor
          } flex items-center gap-1 hover:underline`}
        >
          {footerAction} <span aria-hidden="true">&gt;</span>
        </a>
      </div>
    </div>
  );
}
