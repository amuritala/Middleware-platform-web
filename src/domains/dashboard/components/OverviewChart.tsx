import { useMemo } from "react";
import { useClients } from "../../../lib/useClients";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const W = 500;
const H = 200;

function countByMonth(clients: { createdAt: string }[], year: number) {
  const counts = new Array(12).fill(0) as number[];
  for (const c of clients) {
    const d = new Date(c.createdAt);
    if (!Number.isNaN(d.getTime()) && d.getFullYear() === year) {
      counts[d.getMonth()] += 1;
    }
  }
  return counts;
}

export default function OverviewChart() {
  const { clients, status } = useClients();

  const year = new Date().getFullYear();
  const lastYear = year - 1;
  const current = useMemo(() => countByMonth(clients, year), [clients, year]);
  const previous = useMemo(
    () => countByMonth(clients, lastYear),
    [clients, lastYear],
  );

  const currentTotal = current.reduce((a, b) => a + b, 0);
  const previousTotal = previous.reduce((a, b) => a + b, 0);

  // Y axis: round up to a sensible step so lines have headroom.
  const peak = Math.max(4, ...current, ...previous);
  const step = peak <= 8 ? 1 : peak <= 20 ? 5 : Math.ceil(peak / 20 / 5) * 5;
  const top = Math.ceil(peak / step) * step;

  const toPath = (counts: number[]) =>
    counts
      .map((v, i) => {
        const x = (i / 11) * W;
        const y = H - (v / top) * H;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const currentPath = toPath(current);
  const previousPath = toPath(previous);
  const areaPath = `${currentPath} L${W},${H} L0,${H} Z`;

  // Highlight the current month's dot on the current-year line.
  const nowMonth = new Date().getMonth();
  const dotX = (nowMonth / 11) * W;
  const dotY = H - (current[nowMonth] / top) * H;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Company registrations per month
          </p>
        </div>
        <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
          {year} vs {year - 1}
        </span>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-sm text-gray-500">{year}</span>
          <span className="text-sm font-semibold text-gray-900">
            {status === "success" ? currentTotal : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-orange-500" />
          <span className="text-sm text-gray-500">{year - 1}</span>
          <span className="text-sm font-semibold text-gray-900">
            {status === "success" ? previousTotal : "—"}
          </span>
        </div>
      </div>

      {status === "loading" && (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">
          Loading registrations…
        </div>
      )}

      {status === "error" && (
        <div className="h-64 flex items-center justify-center text-sm text-red-500">
          Could not load registration data
        </div>
      )}

      {status === "success" && (
        <div className="relative h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400 w-8">
            {Array.from({ length: 5 }, (_, i) => top - (i * top) / 4).map(
              (v, i) => (
                <span key={i}>{v}</span>
              ),
            )}
          </div>

          {/* Chart area */}
          <div className="absolute left-10 right-0 top-0 bottom-8">
            <div className="absolute inset-0 flex flex-col justify-between">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-gray-100" />
              ))}
            </div>

            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Previous year: dashed */}
              <path
                d={previousPath}
                fill="none"
                stroke="rgb(249, 115, 22)"
                strokeWidth="2"
                strokeDasharray="8,4"
                opacity="0.5"
                vectorEffect="non-scaling-stroke"
              />
              {/* Current year: solid with fill */}
              <path d={areaPath} fill="url(#orangeGradient)" />
              <path
                d={currentPath}
                fill="none"
                stroke="rgb(249, 115, 22)"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Current-month dot */}
            <div
              className="absolute w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(dotX / W) * 100}%`,
                top: `${(dotY / H) * 100}%`,
              }}
            />
          </div>

          {/* X-axis labels */}
          <div className="absolute left-10 right-0 bottom-0 flex justify-between text-xs text-gray-400">
            {MONTHS.map((month, i) => (
              <span
                key={month}
                className={i === nowMonth ? "text-gray-900 font-medium" : ""}
              >
                {month}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
