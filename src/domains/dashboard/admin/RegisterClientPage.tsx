import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import RegisterForm from "../../auth/components/RegisterForm";

/**
 * The sign-up flow embedded in the admin portal. Unlike the public form it posts to the
 * admin-only `POST /api/admin/clients`, so the vendor is created ACTIVE (ROLE_CLIENT, no
 * approval queue) and must replace the temporary password the admin chose at first sign-in.
 */
export default function RegisterClientPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-20 p-6">
        <TopNav portal="admin" />

        <div className="mb-6 mt-20">
          <h1 className="text-3xl font-bold text-gray-900">Register Client</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a vendor account that goes live immediately - the vendor signs in
            with the password you set below and must change it at first sign-in
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-3xl">
          <RegisterForm
            onBackHome={() => navigate("/admin-dashboard")}
            onRegistered={() => navigate("/admin/clients")}
            showLoginLink={false}
            variant="admin"
          />
        </div>
      </div>
    </div>
  );
}
