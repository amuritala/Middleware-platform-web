import { useEffect, useLayoutEffect, useRef, useState } from "react";
import FeatureCard from "./FeatureCard";

function ShieldIcon() {
  return (
    <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

const features = [
  {
    number: "01",
    category: "PROTOCOL",
    title: "Secure Banking",
    description: "Enterprise-grade vault rails safeguarding institutional settlements with continuous redundancy.",
    badge: "99.99% SLA",
    badgeColor: "orange" as const,
    iconBg: "bg-orange-50",
    icon: <ShieldIcon />,
    footerTag: "Core Isolation",
    footerAction: "Inspect",
    footerActionColor: "text-orange-500",
  },
  {
    number: "02",
    category: "ROUTING",
    title: "Smart Payments",
    description: "Sub-second multi-currency clearing protocols with automated liquidity rebalancing.",
    badge: "INSTANT",
    badgeColor: "blue" as const,
    iconBg: "bg-blue-50",
    icon: <ZapIcon />,
    footerTag: "Zero Latency",
    footerAction: "Transact",
    footerActionColor: "text-blue-600",
  },
  {
    number: "03",
    category: "TELEMETRY",
    title: "Analytics",
    description: "Real-time middleware pipeline metrics, volume velocity, and AI cash flow prediction.",
    badge: "STREAMING",
    badgeColor: "purple" as const,
    iconBg: "bg-purple-50",
    icon: <ChartIcon />,
    footerTag: "Live Feed",
    footerAction: "Explore",
    footerActionColor: "text-purple-600",
  },
  {
    number: "04",
    category: "SHIELD",
    title: "Encryption",
    description: "Quantum-resilient cryptographic keys paired with zero-trust biometric & MFA tokenization.",
    badge: "AES-256",
    badgeColor: "green" as const,
    iconBg: "bg-emerald-50",
    icon: <LockIcon />,
    footerTag: "Zero-Trust",
    footerAction: "Verify",
    footerActionColor: "text-emerald-600",
  },
];

/** Internal size of the orbit stage. The whole stage is scaled down
 *  (via CSS transform) to fit the available container width. */
const STAGE_W = 620;
const STAGE_H = 580;

/** Distance each ring card sits from the center of the stage. */
const RING = { x: 230, y: 230 };

/** A card on the ring is rendered at this fraction of its full size. */
const RING_SCALE = 0.55;

const CARD_WIDTH = 280;

const TRANSITION_MS = 950;
const MOVE_MS = TRANSITION_MS + 80;
const HOLD_MS = 2700;

/** Easings: pop uses a gentle overshoot, everything else glides. */
const POP_EASING = "cubic-bezier(0.34, 1.45, 0.64, 1)";
const GLIDE_EASING = "cubic-bezier(0.45, 0, 0.2, 1)";

type Slot = "center" | "left" | "top" | "right";

/** Ring position offsets (from stage center) for each slot.
 *  Cards travel center -> right -> top -> left -> center. */
const SLOT_OFFSET: Record<Slot, { x: number; y: number }> = {
  center: { x: 0, y: 0 },
  right: { x: RING.x, y: 0 },
  top: { x: 0, y: -RING.y },
  left: { x: -RING.x, y: 0 },
};

/** Which ring slot a card occupies, given which feature is currently featured. */
function slotFor(index: number, activeIndex: number): Slot {
  switch ((index - activeIndex + 4) % 4) {
    case 1:
      return "left";
    case 2:
      return "top";
    case 3:
      return "right";
    default:
      return "center";
  }
}

function OrbitShowcase({ dark = false }: { dark?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [moving, setMoving] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Hold the featured card, then advance the ring; once the move settles, hold again.
  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setTimeout(
      () => {
        if (moving) {
          setMoving(false);
        } else {
          setMoving(true);
          setActiveIndex((prev) => (prev + 1) % features.length);
        }
      },
      moving ? MOVE_MS : HOLD_MS,
    );
    return () => window.clearTimeout(timer);
  }, [moving, activeIndex, reducedMotion]);

  // Fit the fixed-size stage into whatever width the hero gives us.
  const stageRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setFit(Math.min(1, el.clientWidth / STAGE_W));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cx = STAGE_W / 2;
  const cy = STAGE_H / 2;
  const centerSlot = activeIndex;

  return (
    <div ref={stageRef} className="w-full mx-auto" style={{ maxWidth: STAGE_W }}>
      <div
        className="relative w-full overflow-visible"
        style={{ height: STAGE_H * fit }}
      >
        <div
          className="absolute left-1/2 top-0"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `translateX(-50%) scale(${fit})`,
            transformOrigin: "top center",
          }}
        >
          {/* Faint orbit ring behind the cards */}
          <div
            className={`absolute rounded-full border ${
              dark ? "border-white/10" : "border-slate-300/50"
            }`}
            style={{
              left: cx - RING.x,
              top: cy - RING.y,
              width: RING.x * 2,
              height: RING.y * 2,
            }}
          />
          {/* Soft glow where the featured card pops */}
          <div
            className={`absolute rounded-full blur-2xl bg-gradient-to-br ${
              dark
                ? "from-purple-500/25 via-orange-500/15 to-transparent"
                : "from-purple-200/40 via-orange-100/30 to-transparent"
            }`}
            style={{ left: cx - 170, top: cy - 170, width: 340, height: 340 }}
          />

          {features.map((feature, index) => {
            const slot = slotFor(index, centerSlot);
            const isCenter = slot === "center";
            const offset = SLOT_OFFSET[slot];
            const isPopping = isCenter; // transition INTO center overshoots
            const scale = isCenter ? 1 : RING_SCALE;

            return (
              <div
                key={feature.number}
                className="absolute will-change-transform"
                style={{
                  left: 0,
                  top: 0,
                  width: CARD_WIDTH,
                  zIndex: isCenter ? 30 : 10,
                  transform: `translate(${cx + offset.x}px, ${
                    cy + offset.y
                  }px) translate(-50%, -50%) scale(${scale})`,
                  opacity: isCenter ? 1 : dark ? 0.9 : 0.72,
                  transition: `transform ${TRANSITION_MS}ms ${
                    isPopping ? POP_EASING : GLIDE_EASING
                  }, opacity 450ms ease`,
                  filter: isCenter
                    ? dark
                      ? "drop-shadow(0 24px 50px rgba(249, 115, 22, 0.28))"
                      : "drop-shadow(0 24px 40px rgba(124, 58, 237, 0.18))"
                    : "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.06))",
                }}
              >
                <FeatureCard {...feature} dark={dark} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FeatureGrid({ dark = false }: { dark?: boolean }) {
  return <OrbitShowcase dark={dark} />;
}
