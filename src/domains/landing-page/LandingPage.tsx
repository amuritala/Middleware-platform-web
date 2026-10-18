import Navbar from "./components/Navbar";
import Hero from "./components/Hero";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-orange-50/30">
      <Navbar />
      <Hero />
    </div>
  );
}
