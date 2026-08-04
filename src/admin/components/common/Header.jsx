import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { markAsRead, markAllRead } from "../../store/slices/notificationSlice";
import { logoutUser } from "../../store/slices/authSlice";
import { fetchNotifications } from "../../store/slices/notificationSlice";
import ConfirmModal from "./ConfirmModal"; 

const Header = ({ onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [avatarError, setAvatarError] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector(
    (state) => state.notifications,
  );

  // Get user's display name
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.employee?.name) return user.employee.name;
    if (user?.username) return user.username;
    return "HR Admin";
  };

  // Get user's email
  const getUserEmail = () => {
    if (user?.email) return user.email;
    if (user?.username) return user.username;
    return "admin@example.com";
  };

  // Get user's avatar
  const getUserAvatar = () => {
    if (avatarError) return null;
    
    const avatar = user?.avatar;
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

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const name = getUserName();
    if (name && name !== "HR Admin") {
      return name.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Get page title based on current route (same as before)
  const getPageTitle = () => {
    // ... (keep your existing getPageTitle function)
  };

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    const updateDate = () => {
      setCurrentDate(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
  };

  const handleLogoutClick = () => {
    setShowProfile(false);
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

  const userAvatar = getUserAvatar();
  const userInitials = getUserInitials();
  const userName = getUserName();
  const userEmail = getUserEmail();

  // Check permissions for modules
  const hasAllPermissions = user?.permissions?.all === true;
  const userType = user?.type || "";

  const hasReadPermission = (slug) => {
    if (hasAllPermissions) return true;
    if (userType === 'admin') return true;
    
    const modulePermission = user?.permissions?.[slug];
    if (modulePermission) {
      return modulePermission.read === true;
    }
    
    const publicModules = ["dashboard", "my-leaves", "my-tasks", "task-reports", "my-wfh-requests", "my-profile"];
    if (publicModules.includes(slug)) return true;
    
    return false;
  };

  const showSettings = hasReadPermission("settings");


  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 md:px-6 py-2 md:py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="md:hidden w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <i className="fas fa-bars text-gray-600 dark:text-gray-300 text-lg"></i>
            </button>

            <div>
              <h1 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:block bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-full text-xs font-medium">
              <i className="far fa-calendar-alt mr-2"></i>
              <span>{currentDate}</span>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 md:w-10 md:h-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center"
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
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-green-500 hover:text-green-600"
                    >
                      Mark all as read
                    </button>
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
                          className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${!notification.read
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
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                      }}
                      className="text-xs text-green-500 hover:text-green-600"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden shadow-md ring-2 ring-transparent hover:ring-green-500 transition-all"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                    {userInitials}
                  </div>
                )}
              </button>

              {showProfile && (
                <div className="absolute top-12 right-0 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-4 flex gap-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-green-500 to-green-600 flex-shrink-0">
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={userName}
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
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {userName}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <p className="mb-1">
                        <span className="font-semibold">Role:</span>{" "}
                        {user?.type === "admin" ? "Administrator" : "Employee"}
                      </p>
                    </div>
                  </div>
                  {showSettings && (
                    <NavLink
                      to="/admin/settings"
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowProfile(false)}
                    >
                      <i className="fas fa-user text-green-500 w-5"></i>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Account Settings
                      </span>
                    </NavLink>
                  )}
                  <div>
                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <i className="fas fa-arrow-right-from-bracket text-red-500 w-5"></i>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Sign out
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Logout Confirmation"
        message={`Are you sure you want to logout, ${userName}? You will need to login again to access your account.`}
        confirmText="Logout"
        cancelText="Cancel"
        loading={logoutLoading}
      />
    </>
  );
};

export default Header;