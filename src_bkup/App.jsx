import React, { useEffect, useState } from "react";

import {
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import {
    useKeycloak
} from "@react-keycloak/web";

import LandingPage from "./components/LandingPage";
import AdminDashboard from "./components/AdminDashboard";
import ClientDashboard from "./components/ClientDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import RegistrationForm from "./components/RegistrationForm";


function App() {

    const {
        keycloak,
        initialized
    } = useKeycloak();

    const [userRole, setUserRole] = useState(null);


    useEffect(() => {

        if (!initialized) {
            return;
        }

        if (!keycloak.authenticated) {
            setUserRole(null);
            return;
        }

        const roles =
            keycloak.realmAccess?.roles || [];

        console.log("Keycloak roles:", roles);


        if (roles.includes("ROLE_ADMIN")) {

            console.log("User role: ADMIN");

            setUserRole("admin");

        } else if (roles.includes("ROLE_CLIENT")) {

            console.log("User role: CLIENT");

            setUserRole("client");

        } else {

            console.log("User has no recognized role");

            setUserRole(null);
        }

    }, [
        initialized,
        keycloak.authenticated
    ]);


    if (!initialized) {
        return <h2>Loading...</h2>;
    }


    /*
     * Decide where an authenticated user should go.
     */
    function RoleRedirect() {

        if (!keycloak.authenticated) {
            return <LandingPage />;
        }

        if (!userRole) {
            return <h2>Checking permissions...</h2>;
        }

        if (userRole === "admin") {
            return (
                <Navigate
                    to="/admin-dashboard"
                    replace
                />
            );
        }

        if (userRole === "client") {
            return (
                <Navigate
                    to="/client-dashboard"
                    replace
                />
            );
        }

        return <LandingPage />;
    }


    return (

        <Routes>

            {/*
             * This is now role-aware.
             *
             * Admin  -> /admin-dashboard
             * Client -> /client-dashboard
             * Not logged in -> LandingPage
             */}
            <Route
                path="/"
                element={<RoleRedirect />}
            />


            <Route
                path="/register"
                element={<RegistrationForm />}
            />


            <Route
                path="/admin-dashboard"
                element={
                    <ProtectedRoute
                        requiredRole="admin"
                        userRole={userRole}
                    >
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />


            <Route
                path="/client-dashboard"
                element={
                    <ProtectedRoute
                        requiredRole="client"
                        userRole={userRole}
                    >
                        <ClientDashboard />
                    </ProtectedRoute>
                }
            />

        </Routes>

    );
}


export default App;