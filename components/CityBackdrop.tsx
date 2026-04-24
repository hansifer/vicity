export function CityBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-176 bg-[url('/city-backdrop.svg')] bg-cover bg-top opacity-90">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(245,250,255,0)_46%,rgba(219,232,245,0.84)_82%,rgba(219,232,245,1)_100%)]" />
      </div>
      <div className="city-orb absolute -left-24 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(115,195,244,0.58),transparent_68%)] blur-3xl" />
      <div className="city-orb absolute -right-32 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,190,122,0.44),transparent_70%)] blur-3xl [animation-delay:4s]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.5),transparent_44%)]" />
    </div>
  );
}
