import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plane, User, Menu, X, LogOut, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore India 🇮🇳', path: '/explore-india', isBadge: true },
    ...(isAuthenticated
      ? [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'My Trips', path: '/my-trips' },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer">
            <Link to="/" className="flex items-center gap-2">
              <Plane className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">AI Trip Planner</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                  link.isBadge
                    ? 'px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30 hover:bg-amber-500/20'
                    : location.pathname === link.path
                    ? 'text-primary font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>

            <div className="flex items-center space-x-3 ml-2 border-l border-slate-200 dark:border-slate-800 pl-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Hi, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name?.split(' ')[0]}</span>
                  </span>
                  <Link to="/profile">
                    <Button variant="outline" size="icon" className="rounded-full dark:border-slate-700 dark:hover:bg-slate-800">
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600 dark:hover:text-red-400">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="dark:text-slate-200 dark:hover:bg-slate-800">Sign In</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 dark:text-slate-300 p-2">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-3 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                    Signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.email}</span>
                  </div>
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200">Profile</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 dark:text-red-400">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200">Sign In</Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-primary">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
