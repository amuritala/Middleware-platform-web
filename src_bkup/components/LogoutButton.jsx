import React from "react";
import { useKeycloak } from "@react-keycloak/web";

const LogoutButton = () => {

    const { keycloak } = useKeycloak();

    const handleLogout = () => {

        keycloak.logout({
            redirectUri: window.location.origin + "/"
        });

    };

    return (
        <button onClick={handleLogout} className="btn-logout">
            Logout
        </button>
    );
};

export default LogoutButton;