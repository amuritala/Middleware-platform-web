import { useNavigate } from 'react-router-dom';
import FeatureGrid from "./FeatureGrid";

export default function Hero() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <section className="flex flex-col lg:flex-row items-center gap-12 px-14 py-16">
      <div className="flex-1 space-y-6">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-semi-bold leading-[1.1] tracking-tight">
          <span className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent sm:text-6xl lg:text-6xl font-bold">
            <span className="font-semi-bold bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent  lg:text-6xl">
              Welcome to Sky
            </span>
          </span>{" "}
          <br></br>
          <span className="font-bold bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent lg:text-6xl">
            Bank Middleware
          </span>
          <br></br>
          <span className="text-gray-900  font-semi-bold">
            Onboarding Platform
          </span>
        </h1>
        <p className="text-gray-500 text-base leading-relaxed max-w-lg">
          Experience seamless banking operations, secure transactions, and
          intelligent financial management. Join us in revolutionizing the
          banking experience.
        </p>

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleRegister}
            className="px-6 py-3 bg-[#ff6600] text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors"
          >
            Register your company
          </button>
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Login
          </button>
        </div>
      </div>

      <div className="flex-1 w-full">
        <FeatureGrid />
      </div>
    </section>
  );
}