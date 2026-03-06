import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, Key, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { User } from '@/types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isLanding = location.pathname === '/';
  const isDashboard = location.pathname.startsWith('/dashboard');

  const handleLogout = () => {
    onLogout();
    setProfileOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const landingLinks = [
    { label: 'Features', href: '#features' },
    { label: 'API', href: '#api' },
    { label: 'How it Works', href: '#how-it-works' },
  ];

  const dashboardLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  ];

  return (
    <nav
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        'glass border-b border-primary-100/50',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-8 h-8 bg-primary-900 rounded-lg flex items-center justify-center group-hover:bg-primary-800 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 10L12 7L18 10V16L12 19L6 16V10Z" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="13" r="2" fill="#3b82f6"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-primary-900 tracking-tight">
              Receipt<span className="text-accent-600">IQ</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {isLanding && !user && landingLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="btn-ghost text-sm"
              >
                {link.label}
              </a>
            ))}
            {isDashboard && user && dashboardLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={clsx(
                  'btn-ghost text-sm flex items-center gap-1.5',
                  location.pathname === link.href && 'bg-primary-50 text-primary-900',
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-primary-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center text-sm font-semibold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-primary-700 max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-premium-lg border border-primary-100 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-primary-100">
                        <p className="text-sm font-medium text-primary-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-primary-400 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link
                          to="/dashboard/api-keys"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                        >
                          <Key className="w-4 h-4" />
                          API Keys
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">
                  Log In
                </Link>
                <Link to="/register" className="btn-primary text-sm !py-2.5 !px-5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-primary-50 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-primary-100 bg-white/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {isLanding && !user && landingLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}

              {user && dashboardLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors',
                    location.pathname === link.href && 'bg-primary-50 text-primary-900',
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}

              <div className="pt-3 border-t border-primary-100 space-y-1">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-primary-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-medium text-white bg-primary-900 hover:bg-primary-800 text-center transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-outside overlay for profile dropdown */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setProfileOpen(false)}
        />
      )}
    </nav>
  );
}
