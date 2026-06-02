import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const STATUS_COLORS = {
  Active: '#10b981',
  Inactive: '#ef4444',
  Completed: '#3b82f6',
  'On Hold': '#f59e0b'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-[var(--text)]">{data.name}</p>
        <p className="text-sm text-green-500">
          Count: {data.value}
        </p>
        <p className="text-xs text-[var(--muted)]">
          Percentage: {((data.value / data.total) * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

const ProjectStatusChart = ({ projects, title, subtitle }) => {
  const statusCount = projects.reduce((acc, project) => {
    const status = project.status || 'Active';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(statusCount).map(([name, value]) => ({
    name,
    value,
    total: projects.length
  }));

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
        <p className="text-xs text-[var(--muted)]">{subtitle}</p>
      </div>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-[var(--muted)]">No project data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.name] || '#6b7280'} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
      
      {/* Status Summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.map((item) => (
          <div key={item.name} className="text-center p-2 bg-[var(--surface2)] rounded-lg">
            <div 
              className="w-3 h-3 rounded-full mx-auto mb-1"
              style={{ backgroundColor: STATUS_COLORS[item.name] || '#6b7280' }}
            />
            <p className="text-xs font-semibold text-[var(--text)]">{item.name}</p>
            <p className="text-sm font-bold text-green-500">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectStatusChart;