export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0a]">
      <div className="bg-grid absolute inset-0" />
      <div className="absolute left-1/2 top-[-40%] h-[80vmax] w-[80vmax] -translate-x-1/2 animate-spin-slow rounded-full opacity-25 blur-3xl [background:conic-gradient(from_0deg,rgba(217,70,239,0.35),rgba(0,217,255,0.35),rgba(255,0,110,0.2),rgba(217,70,239,0.35))]" />
      <div className="absolute left-[8%] top-[22%] h-40 w-40 animate-orb-float rounded-full bg-neon-purple/20 blur-3xl" />
      <div className="absolute right-[10%] top-[35%] h-48 w-48 animate-orb-float rounded-full bg-neon-cyan/20 blur-3xl [animation-delay:-4s]" />
      <div className="absolute bottom-[12%] left-[30%] h-36 w-36 animate-orb-float rounded-full bg-neon-pink/15 blur-3xl [animation-delay:-8s]" />
      <div className="absolute bottom-[25%] right-[28%] h-28 w-28 animate-orb-float rounded-full bg-neon-green/15 blur-3xl [animation-delay:-2s]" />
    </div>
  );
}
