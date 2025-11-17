import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-black/95 border-b border-purple-500/30 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              NaviGo Admin
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex space-x-2">
                <Link
                  to="/events"
                  className={`px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                    location.pathname === '/' || location.pathname === '/events'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-purple-500/20 hover:text-white'
                  }`}
                >
                  Event Approval
                </Link>
                <Link
                  to="/reviews"
                  className={`px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                    location.pathname === '/reviews'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-purple-500/20 hover:text-white'
                  }`}
                >
                  Review Moderation
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-xs sm:text-sm text-gray-400 hidden lg:inline">Admin</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-purple-500/20 rounded-lg transition-all duration-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-purple-500/30 py-4 space-y-2">
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === '/' || location.pathname === '/events'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-purple-500/20 hover:text-white'
                }`}
              >
                Event Approval
              </Link>
              <Link
                to="/reviews"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === '/reviews'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-purple-500/20 hover:text-white'
                }`}
              >
                Review Moderation
              </Link>
              <div className="pt-2 border-t border-purple-500/20">
                <div className="px-4 py-2 text-xs text-gray-400">Admin</div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;

