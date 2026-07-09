// src/admin/components/dashboard/WelcomeBanner.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../../context/ThemeContext';

const WelcomeBanner = ({ stats, user }) => {
  const navigate = useNavigate();
  const { primaryColor, primaryDark } = useAppTheme();
  
  if (!stats) return null;
  
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  const adjustColor = (color, percent) => {
    let r, g, b;
    if (color.startsWith('#')) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else {
      return color;
    }
    r = Math.max(0, Math.min(255, r + (r * percent) / 100));
    g = Math.max(0, Math.min(255, g + (g * percent) / 100));
    b = Math.max(0, Math.min(255, b + (b * percent) / 100));
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };

  const gradientStyle = {
    background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark || adjustColor(primaryColor, -20)})`
  };

  // Quick actions with icons only + tooltip/visual indicators
  const quickActions = [
    { icon: 'fa-user-plus', label: 'Add Emp', path: 'employees/add-employee', color: 'bg-emerald-400/20 hover:bg-emerald-400/30', border: 'border-emerald-400/30' },
    { icon: 'fa-project-diagram', label: 'Create Proj', path: 'projects', color: 'bg-purple-400/20 hover:bg-purple-400/30', border: 'border-purple-400/30' },
    { icon: 'fa-file-alt', label: 'Report', path: 'reports', color: 'bg-amber-400/20 hover:bg-amber-400/30', border: 'border-amber-400/30' },
  ];

  const handleQuickAction = (path) => {
    navigate(`/admin/${path}`);
  };

  return (
    <div 
      className="welcome-banner rounded-xl p-5 md:p-6 mb-6"
      style={gradientStyle}
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left side - Greeting */}
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-bold text-white">
            {greeting}, {user?.employee?.name || 'Admin'}! 😊
          </h2>
          <p className="text-green-50/80 text-xs md:text-sm mt-0.5">Here's your team's pulse for today.</p>
        </div>

        {/* Right side - Stats + Quick Actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Stats Row - Smaller font */}
          {/* <div className="flex gap-4 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
            <div className="text-center">
              <div className="text-white text-lg font-bold">{stats.punchedInToday || 0}</div>
              <div className="text-white/50 text-[10px] uppercase tracking-wider">Punched In</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-white text-lg font-bold">{stats.late || 0}</div>
              <div className="text-white/50 text-[10px] uppercase tracking-wider">Late</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-white text-lg font-bold">{stats.attendanceRate || 0}%</div>
              <div className="text-white/50 text-[10px] uppercase tracking-wider">Attendance</div>
            </div>
          </div> */}

          {/* Quick Action Links - Visual Cards */}
          <div className="flex gap-2">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => handleQuickAction(action.path)}
                className={`
                  group relative px-3 py-1.5 rounded-lg 
                  ${action.color}
                  border ${action.border}
                  text-white text-[11px] font-medium
                  transition-all duration-200
                  hover:scale-105 hover:shadow-lg
                  flex items-center gap-2
                `}
              >
                <i className={`fas ${action.icon} text-xs`}></i>
                <span className="hidden sm:inline">{action.label}</span>
                {/* Hover glow effect */}
                <span className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/5 transition-all duration-200"></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;