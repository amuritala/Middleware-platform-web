import FeatureGrid from "../../landing-page/components/FeatureGrid";

export default function AuthPanel() {
  return (
    <div className="hidden lg:flex flex-col relative overflow-hidden h-full bg-gradient-to-br from-[#120d16] via-[#180f14] to-[#241108]">
      {/* Warm ambient glows */}
      <div
        className="pointer-events-none absolute -top-32 -right-24 w-96 h-96 rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(249,115,22,0.35), transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.35), transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative flex flex-col flex-1 px-10 py-10">
        {/* Copy */}
        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-orange-300/90">
            Sky Bank Middleware
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white leading-tight">
            Onboard once.
            <br />
            <span className="bg-gradient-to-r from-orange-300 via-orange-200 to-purple-300 bg-clip-text text-transparent">
              Operate everywhere.
            </span>
          </h2>
          <p className="mt-3 text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
            Bank-grade rails for the institutions that move money at the speed
            of thought.
          </p>
        </div>

        {/* Orbit showcase */}
        <div className="flex-1 flex items-center justify-center min-h-0 pt-4">
          <FeatureGrid dark />
        </div>

        {/* Trust footer */}
        <div className="mt-2 flex items-center justify-center gap-7">
          {["PCI-DSS", "ISO 27001", "SOC 2", "SWIFT-Ready"].map((t) => (
            <span
              key={t}
              className="text-[10px] font-medium tracking-[0.18em] uppercase text-white/35"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
