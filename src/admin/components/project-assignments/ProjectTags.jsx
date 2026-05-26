import React from "react";

const ProjectTags = ({ projectIds, projectsList }) => {
  if (!projectIds || projectIds.length === 0) {
    return <span className="text-gray-400 italic text-xs">No projects assigned</span>;
  }

  // Map project IDs to their names
  const assignedProjects = projectIds
    .map((id) => projectsList.find((p) => p.id === id || String(p.id) === String(id)))
    .filter(Boolean);

  const displayLimit = 3;
  const displayItems = assignedProjects.slice(0, displayLimit);
  const remainingCount = assignedProjects.length - displayLimit;

  return (
    <div className="flex flex-wrap items-center gap-1.5 justify-start max-w-md">
      {displayItems.map((proj) => (
        <span
          key={proj.id}
          className="inline-flex items-center px-2.5 py-1 text-xs font-bold leading-none text-green-700 dark:text-green-300 bg-green-500/10 dark:bg-green-500/5 rounded-full border border-green-500/10 dark:border-green-500/10 max-w-[120px] truncate"
          title={proj.name}
        >
          {proj.name}
        </span>
      ))}

      {remainingCount > 0 && (
        <span
          className="inline-flex items-center px-2 py-1 text-[10px] font-extrabold leading-none text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 rounded-full border border-gray-250 dark:border-gray-600 cursor-help"
          title={assignedProjects
            .slice(displayLimit)
            .map((p) => p.name)
            .join(", ")}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

export default ProjectTags;
