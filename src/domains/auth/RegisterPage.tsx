import { useNavigate } from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import AuthPanel from "./components/AuthPanel";
import logo from "../../assets/skybank-logo.png";

export default function RegisterPage() {
  const navigate = useNavigate();

  const goBackHome = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form (60%) */}
      <div
        className="w-[60%] flex flex-col items-center justify-center p-8 bg-[radial-gradient(rgba(100,116,139,0.22)_1px,transparent_1px)]"
        style={{ backgroundSize: "20px 20px" }}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img src={logo} alt="Sky Bank Sierra Leone" className="h-14" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Register your company
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Join Sky Bank and start your financial journey
            </p>
          </div>

          <RegisterForm onBackHome={goBackHome} />
        </div>
      </div>

      {/* Right Side - Auth Panel (40%) */}
      <div className="w-[40%] min-h-screen">
        <AuthPanel />
      </div>
    </div>
  );
}