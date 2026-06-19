// Fixed decorative background: a faint grid plus two soft radial gradient
// glows. Uses CSS only — no blur filters, no external images.
export function Background() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base"
    >
      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 80%)",
        }}
      />
      {/* gradient glows */}
      <div
        className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.35), transparent 60%)",
        }}
      />
      <div
        className="absolute right-[-10%] top-[20%] h-[420px] w-[520px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(45,212,191,0.3), transparent 62%)",
        }}
      />
    </div>
  );
}
