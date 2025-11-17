import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-black/95 border-b border-purple-500/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
                NaviGo Admin
              </Link>
              <div className="flex space-x-4">
                <Link
                  to="/events"
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === '/' || location.pathname === '/events'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-purple-500/20 hover:text-white'
                  }`}
                >
                  Event Approval
                </Link>
                <Link
                  to="/reviews"
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === '/reviews'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-purple-500/20 hover:text-white'
                  }`}
                >
                  Review Moderation
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Admin</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;

