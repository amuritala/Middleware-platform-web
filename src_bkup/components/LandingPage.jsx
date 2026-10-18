import { useKeycloak } from '@react-keycloak/web';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const { keycloak } = useKeycloak();
    const navigate = useNavigate();

    const handleLogin = () => {
        keycloak.login({
            redirectUri:
                window.location.origin + "/admin-dashboard"
        });
    };

    const handleRegister = () => {
        navigate('/register');
    };

    return (
        <div className="landing-container">
            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Welcome to <span className="highlight">Techstack Banking</span>
                    </h1>
                    <p className="hero-subtitle">
                        Empowering Your Financial Future with Innovative Banking Solutions
                    </p>
                    <p className="hero-description">
                        Experience seamless banking operations, secure transactions,
                        and intelligent financial management. Join us in revolutionizing
                        the banking experience.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn btn-primary" onClick={handleRegister}>
                            Register Your Company
                        </button>
                        <button className="btn btn-secondary" onClick={handleLogin}>
                            Login
                        </button>
                    </div>
                </div>
                <div className="hero-image">
                    <div className="floating-cards">
                        <div className="card">🏦 Secure Banking</div>
                        <div className="card">💳 Smart Payments</div>
                        <div className="card">📊 Analytics</div>
                        <div className="card">🔒 Encryption</div>
                    </div>
                </div>
            </div>
            <footer className="landing-footer">
                <p>{import.meta.env.VITE_APP_NAME} v{import.meta.env.VITE_APP_VERSION}</p>
            </footer>
        </div>
    );
};

export default LandingPage;