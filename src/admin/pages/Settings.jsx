// Settings.jsx - Using useSearchParams
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProfileTab from "../components/settings/ProfileTab";
import SecurityTab from "../components/settings/SecurityTab";
import ThemeTab from "../components/settings/ThemeTab";
import WorkingHoursTab from "../components/settings/WorkingHoursTab";
import PublicHolidaysTab from "../components/settings/PublicHolidaysTab";

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get tab from URL query parameter or default to "profile"
  const getTabFromUrl = () => {
    const tab = searchParams.get("tab");
    const validTabs = ["profile", "security", "working-hours", "public-holidays", "theme"];
    return tab && validTabs.includes(tab) ? tab : "profile";
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl());

  const tabs = [
    { id: "profile", label: "Profile", icon: "fas fa-user", color: "blue" },
    { id: "security", label: "Security", icon: "fas fa-lock", color: "green" },
    { id: "working-hours", label: "Working Hours", icon: "fas fa-clock", color: "purple" },
    { id: "public-holidays", label: "Public Holidays", icon: "fas fa-calendar-alt", color: "red" },
    { id: "theme", label: "Others", icon: "fas fa-palette", color: "orange" },
  ];

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Sync state with URL when back/forward buttons are used
  useEffect(() => {
    const tabFromUrl = getTabFromUrl();
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const getColorClasses = (color, isActive) => {
    if (isActive) {
      switch (color) {
        case "blue": return "bg-blue-500 text-white";
        case "green": return "bg-green-500 text-white";
        case "purple": return "bg-purple-500 text-white";
        case "orange": return "bg-orange-500 text-white";
        case "red": return "bg-red-500 text-white";
        default: return "bg-green-500 text-white";
      }
    }
    return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
  };

  const getTabDescription = (id) => {
    const descriptions = {
      profile: "Personal information",
      security: "Password & security",
      "working-hours": "Manage working hours of employees",
      "public-holidays": "Manage public holidays",
      theme: "Theme & appearance",
    };
    return descriptions[id] || "";
  };

  return (
    <div className="w-full overflow-x-hidden px-4 md:px-6">
      {/* Page Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-green-600 dark:from-gray-200 dark:to-green-400 bg-clip-text text-transparent">
          <i className="fas fa-sliders-h mr-2"></i> Settings
        </h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 p-4 transition-all border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                  activeTab === tab.id
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${getColorClasses(tab.color, activeTab === tab.id)}`}
                >
                  <i className={`${tab.icon} text-base`}></i>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {tab.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getTabDescription(tab.id)}
                  </div>
                </div>
                {activeTab === tab.id && (
                  <div className="w-1.5 h-8 bg-green-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-soft">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "working-hours" && <WorkingHoursTab />}
            {activeTab === "public-holidays" && <PublicHolidaysTab />}
            {activeTab === "theme" && <ThemeTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;