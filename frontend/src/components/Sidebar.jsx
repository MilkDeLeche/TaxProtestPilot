import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowUpTrayIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import FloatingActionMenu from './ui/floating-action-menu';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Squares2X2Icon },
  { path: '/upload', label: 'Upload & Calculate', icon: ArrowUpTrayIcon },
  { path: '/batches', label: 'Saved Uploads', icon: RectangleStackIcon },
  { path: '/customers', label: 'Customers', icon: UserGroupIcon },
  { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export const Sidebar = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -264 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed left-0 top-0 h-full w-64 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a]/95 to-[#0f172a] backdrop-blur-xl border-r border-white/10 text-white p-6 flex flex-col z-50 shadow-2xl shadow-blue-900/20"
    >
      {/* Logo */}
      <div className="mb-10 flex-shrink-0">
        <img
          src="/images/TAXPILOT2 dark.png"
          alt="Tax Protest Pilot"
          className="h-[164px] w-[165px] object-contain object-left"
        />
        <p className="text-xs text-blue-200/80 mt-1">Property Tax Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 space-y-2 pb-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-[#1e40af] text-white shadow-lg shadow-blue-900/30 hover:bg-[#1e3a8a]"
                  : "text-slate-300 hover:text-blue-200 hover:bg-[#1e40af]/10"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section - full row opens Profile / Sign out menu */}
      <div className="border-t border-white/10 pt-6 mt-4 flex-shrink-0">
        <FloatingActionMenu
          placement="top"
          className="w-full"
          trigger={
            <div className="flex items-center gap-3 px-2 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] flex items-center justify-center text-white font-medium shadow-lg shadow-blue-900/30 flex-shrink-0 ring-2 ring-transparent hover:ring-blue-400/50 transition-all">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden text-left">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-blue-200/70 truncate">{user?.email}</p>
              </div>
            </div>
          }
          options={[
              {
                label: 'Profile',
                Icon: <UserIcon className="w-5 h-5" />,
                onClick: () => navigate('/settings'),
              },
              {
                label: 'Sign out',
                Icon: <ArrowRightOnRectangleIcon className="w-5 h-5" />,
                onClick: handleSignOut,
                dataTestId: 'logout-btn',
              },
            ]}
        />
      </div>
    </motion.aside>
  );
};
