export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#020d1f] text-white">
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(42,109,178,0.18),_transparent_30%),linear-gradient(180deg,#020d1f_0%,#020d1f_100%)]">
        {children}
      </div>
    </div>
  );
}
