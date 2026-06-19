// Fixed full-viewport decorative layer: animated aurora orbs + a masked grid +
// fine grain. Pure CSS — no external images, only transform/opacity animations.
export function Background() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base grain"
    >
      {/* deep radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(15,23,42,0.6), transparent 60%), radial-gradient(100% 100% at 50% 120%, rgba(2,3,8,0.9), transparent 70%)",
        }}
      />

      {/* aurora orbs */}
      <div
        className="absolute -left-[10%] -top-[15%] h-[60vh] w-[60vw] rounded-full opacity-60 blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.5), transparent 60%)",
        }}
      />
      <div
        className="absolute right-[-12%] top-[6%] h-[55vh] w-[50vw] rounded-full opacity-50 blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.45), transparent 62%)",
          animationDelay: "-7s",
        }}
      />
      <div
        className="absolute bottom-[-20%] left-[20%] h-[55vh] w-[55vw] rounded-full opacity-40 blur-3xl animate-aurora"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.4), transparent 60%)",
          animationDelay: "-14s",
        }}
      />

      {/* masked grid */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 25%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 25%, transparent 75%)",
        }}
      />

      {/* top hairline glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent" />
    </div>
  );
}
