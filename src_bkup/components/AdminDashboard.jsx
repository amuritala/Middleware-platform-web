import React, { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import LogoutButton from "./LogoutButton";
import axios from 'axios';
import './Dashboard.css';

const AdminDashboard = () => {
    const { keycloak } = useKeycloak();

    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [allRegistrations, setAllRegistrations] = useState([]);
    const [activeClients, setActiveClients] = useState(0);

    // Available roles returned by /api/admin/roles
    const [availableRoles, setAvailableRoles] = useState([]);

    // Roles selected for the registration currently being approved
    const [selectedRoles, setSelectedRoles] = useState([]);

    useEffect(() => {
        fetchPendingRegistrations();
        fetchAllRegistrations();
        fetchRoles();
    }, []);

    const fetchPendingRegistrations = async () => {
        try {
            const token = keycloak.token;

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/clients/pending`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setPendingRegistrations(response.data);
        } catch (error) {
            console.error('Error fetching pending registrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllRegistrations = async () => {
        try {
            const token = keycloak.token;

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/clients`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setAllRegistrations(response.data);

            const activeClientCount = response.data.filter(
                (client) => client.status === "ACTIVE"
            ).length;

            setActiveClients(activeClientCount);
        } catch (error) {
            console.error('Error fetching all registrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const token = keycloak.token;

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/roles`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setAvailableRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const handleRoleChange = (role) => {
        setSelectedRoles((currentRoles) => {
            if (currentRoles.includes(role)) {
                return currentRoles.filter((r) => r !== role);
            }

            return [...currentRoles, role];
        });
    };

    const handleApprove = async (registrationId) => {
        try {
            const token = keycloak.token;

            await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/clients/${registrationId}/approve`,
                {
                    approvedRoles: selectedRoles
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Refresh the list
            await fetchPendingRegistrations();
            await fetchAllRegistrations();

            setSelectedRegistration(null);
            setSelectedRoles([]);
        } catch (error) {
            console.error('Error approving registration:', error);
        }
    };

    const handleReject = async (registrationId) => {
        try {
            const token = keycloak.token;

            await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/clients/${registrationId}/reject`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            await fetchPendingRegistrations();
            await fetchAllRegistrations();

            setSelectedRegistration(null);
            setSelectedRoles([]);
        } catch (error) {
            console.error('Error rejecting registration:', error);
        }
    };

    const handleViewDetails = (registration) => {

        console.log('Viewing details for registration:', registration);

        setSelectedRegistration(registration);
        setSelectedRoles([]);
    };

    const closeModal = () => {
        setSelectedRegistration(null);
        setSelectedRoles([]);
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard-container admin-dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <LogoutButton />
            </div>

            <div className="admin-stats">
                <div className="stat-card">
                    <h4>Total Companies</h4>
                    <p className="stat-number">{allRegistrations.length}</p>
                </div>

                <div className="stat-card">
                    <h4>Pending Approvals</h4>
                    <p className="stat-number">{pendingRegistrations.length}</p>
                </div>

                <div className="stat-card">
                    <h4>Active Clients</h4>
                    <p className="stat-number">{activeClients}</p>
                </div>
            </div>

            <div className="pending-registrations">
                <h2>Pending Registrations</h2>

                {pendingRegistrations.length === 0 ? (
                    <p className="no-pending">No pending registrations</p>
                ) : (
                    <div className="registration-list">
                        {pendingRegistrations.map((reg) => (
                            <div key={reg.id} className="registration-item">
                                <div className="reg-info">
                                    <h4>{reg.companyName}</h4>
                                    <p>Email: {reg.contactEmail}</p>
                                    <p>Industry: {reg.industry}</p>
                                    <p>
                                        Submitted:{' '}
                                        {new Date(reg.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="reg-actions">
                                    <button
                                        className="btn-approve"
                                        onClick={() => handleViewDetails(reg)}
                                    >
                                        Process
                                    </button>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedRegistration && (
                <div
                    className="modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Registration Details</h2>

                        <button
                            className="modal-close"
                            onClick={closeModal}
                        >
                            ×
                        </button>

                        <div className="detail-grid">
                            <div>
                                <strong>Company:</strong>{' '}
                                {selectedRegistration.companyName}
                            </div>

                            <div>
                                <strong>Email:</strong>{' '}
                                {selectedRegistration.contactEmail}
                            </div>

                            <div>
                                <strong>Phone:</strong>{' '}
                                {selectedRegistration.contactPhone}
                            </div>

                            <div>
                                <strong>Address:</strong>{' '}
                                {selectedRegistration.address}, {selectedRegistration.city}, {selectedRegistration.state} {selectedRegistration.zipCode}
                            </div>

                            <div>
                                <strong>Industry:</strong>{' '}
                                {selectedRegistration.industry}
                            </div>

                            <div>
                                <strong>Tax ID:</strong>{' '}
                                {selectedRegistration.taxId}
                            </div>

                            <div>
                                <strong>Contact Person:</strong>{' '}
                                 {selectedRegistration.contactFirstName} {selectedRegistration.contactLastName}
                            </div>

                            <div>
                                <strong>Contact Email:</strong>{' '}
                                {selectedRegistration.contactEmail} 
                            </div>

                            <div>
                                <strong>Contact Phone:</strong>{' '}
                                {selectedRegistration.contactPhone}
                            </div>
                        </div>

                        {/* Roles */}
                        
<div className="roles-section"> <div className="roles-header"> <h3>Assign Roles</h3> <span className="roles-hint">Select at least one</span> </div>
{availableRoles.length === 0 ? (
    <p className="no-roles">No roles available.</p>
) : (
    <div className="roles-list">
        {availableRoles.map((role) => (
            <label key={role} className="role-checkbox">
                <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleRoleChange(role)}
                />
                <span>{role}</span>
            </label>
        ))}
    </div>
)}

</div>

                        <div className="modal-actions">
                            <button
                                className="btn-approve"
                                onClick={() =>
                                    handleApprove(selectedRegistration.id)
                                }
                                disabled={selectedRoles.length === 0}
                            >
                                Approve
                            </button>

                            <button
                                className="btn-reject"
                                onClick={() =>
                                    handleReject(selectedRegistration.id)
                                }
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;