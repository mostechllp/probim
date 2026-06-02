import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-[var(--text)] mb-1">{label}</p>
        <p className="text-sm text-green-500">
          Employees: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const ProjectResourceChart = ({ projects, title, subtitle }) => {
  const data = projects.map(project => ({
    name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
    fullName: project.name,
    employees: project.employeeCount,
    status: project.status,
    priority: project.priority
  })).sort((a, b) => b.employees - a.employees).slice(0, 10); // Top 10 projects

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
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--muted)" />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="var(--muted)"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="employees" 
              name="Employees Assigned" 
              fill="#10b981"
              radius={[0, 4, 4, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ProjectResourceChart;