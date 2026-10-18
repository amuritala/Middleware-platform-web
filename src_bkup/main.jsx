import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ReactKeycloakProvider } from "@react-keycloak/web";

import App from "./App";
import keycloak from "./keycloak";

import "./index.css";


const eventLogger = (event, error) => {
    console.log("Keycloak event:", event, error);
};


ReactDOM.createRoot(
    document.getElementById("root")
).render(

    <ReactKeycloakProvider
        authClient={keycloak}
        onEvent={eventLogger}
        initOptions={{
            onLoad: "check-sso",
            checkLoginIframe: false
        }}
    >

        <BrowserRouter>
            <App />
        </BrowserRouter>

    </ReactKeycloakProvider>

);