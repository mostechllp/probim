import { useNavigate } from 'react-router-dom';

export const StatsCard = ({ title, value, icon, color = 'green', onClick, route }) => {
  const navigate = useNavigate();
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  const textColors = {
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (route) {
      navigate(route);
    }
  };

  return (
    <div 
      className={`stat-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 md:p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft ${onClick || route ? 'cursor-pointer hover:shadow-lg' : ''}`}
      onClick={handleClick}
      role={onClick || route ? 'button' : undefined}
      tabIndex={onClick || route ? 0 : undefined}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && (onClick || route)) {
          handleClick();
        }
      }}
    >
      <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-base md:text-xl mb-2 md:mb-3 ${colorClasses[color]}`}>
        <i className={icon}></i>
      </div>
      <div className={`stat-number text-xl md:text-3xl font-extrabold ${textColors[color]}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
        {title}
      </div>
    </div>
  );
};