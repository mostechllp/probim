import React from "react";
import { PROJECT_MODULE_NAME } from "../../utils/constants";

const ProjectStatsCards = ({ stats, loading }) => {
  const cards = [
    {
      label: `Total ${PROJECT_MODULE_NAME}`,
      value: stats?.totalProjects || 0,
      icon: "fas fa-briefcase",
      color: "from-blue-500 to-indigo-600",
      lightColor: "bg-blue-500/10 text-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      indicatorColor: "text-blue-500 dark:text-blue-400",
      indicator: "Grand Total",
      indicatorIcon: "fas fa-list-check"
    },
    {
      label: "Active Projects",
      value: stats?.activeProjects || 0,
      icon: "fas fa-circle-check",
      color: "from-emerald-500 to-green-600",
      lightColor: "bg-green-500/10 text-green-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      indicatorColor: "text-emerald-500 dark:text-emerald-400",
      indicator: `${stats?.totalProjects ? Math.round(((stats.activeProjects) / stats.totalProjects) * 100) : 0}% Active`,
      indicatorIcon: "fas fa-arrow-trend-up"
    },
    {
      label: "Tagged Employees",
      value: stats?.taggedEmployeesCount || 0,
      icon: "fas fa-users-gear",
      color: "from-amber-500 to-orange-600",
      lightColor: "bg-amber-500/10 text-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      indicatorColor: "text-amber-500 dark:text-amber-400",
      indicator: "Allocated Resources",
      indicatorIcon: "fas fa-user-check"
    },
    {
      label: "Recently Added",
      value: stats?.recentlyAdded || 0,
      icon: "fas fa-calendar-plus",
      color: "from-rose-500 to-pink-600",
      lightColor: "bg-rose-500/10 text-rose-500",
      textColor: "text-rose-600 dark:text-rose-400",
      indicatorColor: "text-rose-500 dark:text-rose-400",
      indicator: "Past 30 days",
      indicatorIcon: "fas fa-clock"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft hover:shadow-soft-lg border border-gray-100 dark:border-gray-700/60 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative group"
        >
          {/* Subtle background glow on hover */}
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-[0.03] rounded-bl-full transition-opacity duration-300`} />

          {loading ? (
            <div className="animate-pulse space-y-4 w-full">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {card.label}
                </span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.lightColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <i className={`${card.icon} text-lg`}></i>
                </div>
              </div>

              <div>
                <h3 className={`text-3xl font-extrabold tracking-tight mb-2 ${card.textColor}`}>
                  {card.value}
                </h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-400">
                  <i className={`${card.indicatorIcon} text-[10px] ${card.indicatorColor}`}></i>
                  <span>{card.indicator}</span>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProjectStatsCards;
