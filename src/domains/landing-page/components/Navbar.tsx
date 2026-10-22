import { Link, useNavigate } from 'react-router-dom';
import logo from '../../../assets/skybank-logo.png';

const navLinks = ["About", "Services", "Pricing", "Company", "Resources"];

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between px-14 py-4">
      <Link to="/">
        <div className="flex items-center">
          <img src={logo} alt="Sky Bank Sierra Leone" className="h-14" />
        </div>
      </Link>

      <ul className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <li key={link}>
            <a
              href={`#${link.toLowerCase()}`}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-4">
        <button
          onClick={handleLogin}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Login
        </button>
      </div>
    </nav>
  );
}