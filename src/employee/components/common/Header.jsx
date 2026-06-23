// src/shared/components/Header.jsx

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useAppTheme } from '../../../context/ThemeContext';
import { logoutUser } from '../../../store/slices/authSlice';

const Header = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { themeMode, setThemeMode } = useAppTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      const wrapper = document.querySelector('.avatar-wrapper');
      if (showProfileMenu && wrapper && !wrapper.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileMenu]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setShowProfileMenu(false);
    navigate("/login");
  };

  // Get user name and role
  const displayName = user?.employee?.name || user?.name || user?.username || 'User';
  const userRole = user?.type || user?.role || 'employee';

  return (
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
            {userRole === 'admin' ? 'Admin Dashboard' : 'Employee Portal'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Welcome back, {displayName}
          </p>
        </div>
      </div>
      
      {/* Right section - Date, Time, Theme toggle, Profile */}
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
        
        {/* Profile Avatar */}
        <div className="avatar-wrapper relative">
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-xl overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-green-500 transition-all duration-200 shadow-md"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                {displayName?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          
          {showProfileMenu && (
            <>
              {/* Backdrop to block clicks on other elements */}
              <div 
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowProfileMenu(false)}
              />
              
              {/* Dropdown menu with highest z-index */}
              <div className="absolute top-[55px] right-0 w-64 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden z-[9999]">
                <div className="profile-header flex gap-3 p-4 items-center border-b border-[var(--border)]">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                      {user?.employee?.name?.charAt(0) || user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text)]">{user?.employee?.name || user?.name || "Employee"}</h4>
                    <p className="text-xs text-[var(--muted)]">Employee</p>
                  </div>
                </div>
                <Link 
                  to="/employee/profile" 
                  className="menu-item flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface2)] text-[var(--text)] no-underline transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <i className="fas fa-user text-green-500"></i> 
                  <span>My Profile</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="menu-item flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface2)] text-[var(--text)] w-full text-left transition-colors"
                >
                  <i className="fas fa-arrow-right-from-bracket text-green-500"></i> 
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;