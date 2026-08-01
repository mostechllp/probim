// src/shared/components/Header.jsx

import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useAppTheme } from '../../../context/ThemeContext';
import { logoutUser } from '../../../store/slices/authSlice';
import { fetchNotifications, markAsRead, markAllRead } from "../../../admin/store/slices/notificationSlice";
import ConfirmModal from '../../../admin/components/common/ConfirmModal'; // Adjust path as needed

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────
// Format user type for display
const formatUserType = (type) => {
  if (!type) return 'User';
  
  const typeMap = {
    'employee': 'Employee',
    'admin': 'Admin',
    'hr': 'HR',
    'manager': 'Manager',
    'team_lead': 'Team Lead',
    'teamlead': 'Team Lead',
    'team lead': 'Team Lead',
  };
  
  const lowerType = type.toLowerCase().trim();
  return typeMap[lowerType] || type;
};

// Format user type for badge/capitalized display
const formatUserTypeBadge = (type) => {
  if (!type) return 'USER';
  
  const typeMap = {
    'employee': 'EMPLOYEE',
    'admin': 'ADMIN',
    'hr': 'HR',
    'manager': 'MANAGER',
    'team_lead': 'TEAM LEAD',
    'teamlead': 'TEAM LEAD',
    'team lead': 'TEAM LEAD',
  };
  
  const lowerType = type.toLowerCase().trim();
  return typeMap[lowerType] || type.toUpperCase();
};

const Header = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { themeMode, setThemeMode } = useAppTheme();
  const { notifications, unreadCount } = useAppSelector(
    (state) => state.notifications || { notifications: [], unreadCount: 0 }
  );
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Update date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get user name and role
  const getUserName = () => {
    if (user?.employee?.name) return user.employee.name;
    if (user?.name) return user.name;
    if (user?.username) return user.username;
    return 'User';
  };

  const getUserEmail = () => {
    if (user?.email) return user.email;
    if (user?.username) return user.username;
    return '';
  };

  // Get raw user role from API
  const rawUserRole = user?.type || user?.role || 'employee';
  // Format the role for display
  const userRole = formatUserType(rawUserRole);
  // Format for badge display (uppercase)
  const userRoleBadge = formatUserTypeBadge(rawUserRole);
  
  const displayName = getUserName();
  const userEmail = getUserEmail();

  // Get user avatar
  const getUserAvatar = () => {
    if (avatarError) return null;
    
    const avatar = user?.avatar || user?.employee?.avatar;
    if (!avatar) return null;
    
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
    
    if (typeof avatar === 'object' && avatar.path) {
      return `${baseUrl}/storage/${avatar.path}`;
    }
    
    if (typeof avatar === 'string') {
      if (avatar.startsWith('http')) return avatar;
      if (avatar.startsWith('/storage/')) return `${baseUrl}${avatar}`;
      if (avatar.startsWith('storage/')) return `${baseUrl}/${avatar}`;
      return `${baseUrl}/storage/${avatar}`;
    }
    
    return null;
  };

  const userAvatar = getUserAvatar();
  const userInitials = displayName?.charAt(0)?.toUpperCase() || "U";

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
  };

  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await dispatch(logoutUser()).unwrap();
      setShowLogoutConfirm(false);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 100);
    } catch (err) {
      console.error("Logout failed", err);
      setLogoutLoading(false);
    }
  };

  // Get the base path for navigation
  const getBasePath = () => {
    // Use raw user type to determine base path
    const rawType = user?.type || user?.role || 'employee';
    return rawType === 'admin' || rawType === 'hr' ? '/admin' : '/employee';
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4 md:px-6 sticky top-0 z-40 flex items-center justify-between flex-wrap gap-3 shadow-sm">
        {/* Left section - Menu button (mobile) and title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">
              {rawUserRole === 'admin' || rawUserRole === 'hr' ? 'Admin Dashboard' : 'Employee Portal'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Welcome back, {displayName}
            </p>
          </div>
        </div>
        
        {/* Right section - Date, Time, Theme toggle, Notifications, Profile */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date and Time */}
          <div className="hidden md:flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-4 py-1.5 rounded-full">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              <i className="far fa-calendar-alt text-green-500"></i>
              <span>{currentDate}</span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              <i className="far fa-clock text-green-500"></i>
              <span>{currentTime}</span>
            </div>
          </div>
          
          {/* Theme toggle */}
          <div className="theme-toggle flex bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setThemeMode('light')}
              className={`theme-btn w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                themeMode === 'light' 
                  ? 'bg-white dark:bg-gray-600 shadow-md text-green-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Light Mode"
            >
              <i className="fas fa-sun"></i>
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={`theme-btn w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                themeMode === 'dark' 
                  ? 'bg-white dark:bg-gray-600 shadow-md text-green-500' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Dark Mode"
            >
              <i className="fas fa-moon"></i>
            </button>
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 md:w-10 md:h-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <i className="fas fa-bell text-gray-600 dark:text-gray-300 text-sm md:text-base"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-green-500 hover:text-green-600"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <i className="fas fa-bell-slash text-3xl mb-2 opacity-50"></i>
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${
                          !notification.read
                            ? "bg-green-50 dark:bg-green-900/20"
                            : ""
                        } hover:bg-gray-50 dark:hover:bg-gray-700`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {notification.title}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <small className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                          {notification.time || "Just now"}
                        </small>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-700/50">
                  <Link
                    to={`${getBasePath()}/notifications`}
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-green-500 hover:text-green-600"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Profile Avatar */}
          <div className="relative" ref={profileRef}>
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-green-500 transition-all duration-200 shadow-md"
            >
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={displayName} 
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                  {userInitials}
                </div>
              )}
            </div>
            
            {showProfileMenu && (
              <div className="absolute top-[55px] right-0 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[9999]">
                <div className="profile-header flex gap-3 p-4 items-center border-b border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-r from-green-500 to-green-600 flex-shrink-0">
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt={displayName} 
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                        {userInitials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {displayName}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userEmail}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 capitalize">
                      {userRole}
                    </p>
                  </div>
                </div>
                <Link 
                  to={`${getBasePath()}/profile`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 no-underline transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <i className="fas fa-user text-green-500 w-5"></i> 
                  <span>My Profile</span>
                </Link>
                <Link 
                  to={`${getBasePath()}/settings`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 no-underline transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <i className="fas fa-cog text-gray-500 w-5"></i> 
                  <span>Settings</span>
                </Link>
                <button 
                  onClick={handleLogoutClick}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 w-full text-left transition-colors border-t border-gray-200 dark:border-gray-700"
                >
                  <i className="fas fa-arrow-right-from-bracket text-red-500 w-5"></i> 
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Logout Confirmation"
        message={`Are you sure you want to logout, ${displayName}? You will need to login again to access your account.`}
        confirmText="Logout"
        cancelText="Cancel"
        loading={logoutLoading}
      />
    </>
  );
};

export default Header;