
import React, { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import LogoutButton from "./LogoutButton";
import axios from 'axios';
import './Dashboard.css';

const ClientDashboard = () => {
    const { keycloak } = useKeycloak();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

    // Get roles assigned to the logged-in user for this client
    const clientRoles =
    keycloak.tokenParsed?.realm_access?.roles || [];

    useEffect(() => {
        if (keycloak.authenticated) {
            fetchClientProfile();
        }
    }, [keycloak.authenticated]);

    const fetchClientProfile = async () => {
        try {
            const token = keycloak.token;

            const response = await axios.get(
                `${import.meta.env.VITE_API_SERVICE}/service`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    // Configuration for the available roles
    const rolePanels = {
        ROLE_CREATE_CUSTOMER: {
            title: 'Create Customer',
            description: 'Create and onboard a new customer.',
            icon: '👤',
            action: 'Create Customer'
        },

        ROLE_CHECK_BALANCE: {
            title: 'Check Balance',
            description: 'View customer and account balances.',
            icon: '💰',
            action: 'Check Balance'
        },

        ROLE_CREATE_ACCOUNT: {
            title: 'Create Account',
            description: 'Create a new banking account.',
            icon: '🏦',
            action: 'Create Account'
        },

        ROLE_PASS_ENTRY: {
            title: 'Debit / Credit',
            description: 'Perform debit and credit transactions.',
            icon: '💳',
            action: 'Debit / Credit'
        }
    };

    if (loading) {
        return (
            <div className="loading">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="dashboard-container">

            {/* Header */}
            <div className="dashboard-header">
                <h1>Client Dashboard</h1>
                <LogoutButton />
            </div>

            {/* Welcome Panel */}
            <div className="dashboard-card welcome-card">
                <h2>
                    Welcome, {profile?.companyName || keycloak.tokenParsed?.preferred_username}
                </h2>

                <p>
                    Select one of the services below to continue.
                </p>
            </div>

            {/* Allowed Role Panels */}
            <div className="dashboard-section">

                <h2>Available Services</h2>

                {clientRoles.length === 0 ? (
                    <div className="dashboard-card">
                        <p>
                            No services have been assigned to your account.
                        </p>
                    </div>
                ) : (
                    <div className="dashboard-grid">

                        {clientRoles.map((role) => {

                            const panel = rolePanels[role];

                            // Ignore roles that don't have a UI panel configured
                            if (!panel) {
                                return null;
                            }

                            return (
                                <div
                                    className="dashboard-card role-card"
                                    key={role}
                                >
                                    <div className="role-icon">
                                        {panel.icon}
                                    </div>

                                    <h3>
                                        {panel.title}
                                    </h3>

                                    <p>
                                        {panel.description}
                                    </p>

                                    <button
                                        className="action-btn"
                                        onClick={() => {
                                            console.log(
                                                `Selected role: ${role}`
                                            );
                                        }}
                                    >
                                        {panel.action}
                                    </button>
                                </div>
                            );
                        })}

                    </div>
                )}

            </div>

        </div>
    );
};

export default ClientDashboard;
