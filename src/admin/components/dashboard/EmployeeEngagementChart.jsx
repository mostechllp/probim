import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Sector
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 shadow-lg max-w-xs">
        <p className="font-semibold text-[var(--text)]">{data.fullName || data.name}</p>
        <p className="text-sm text-green-500">
          Employees: {data.employees}
        </p>
        <p className="text-xs text-[var(--muted)]">
          Engagement: {data.percentageOfTotal}% of total workforce
        </p>
        <p className="text-xs text-[var(--muted)]">
          Status: {data.status}
        </p>
        <p className="text-xs text-[var(--muted)]">
          Priority: {data.priority}
        </p>
      </div>
    );
  }
  return null;
};

const EmployeeEngagementChart = ({ projects, totalEmployees, title, subtitle }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState('bar'); // 'bar' or 'pie'

  const data = projects
    .filter(p => p.employeeCount > 0)
    .map(project => ({
      name: project.name.length > 25 ? project.name.substring(0, 25) + '...' : project.name,
      fullName: project.name,
      employees: project.employeeCount,
      percentageOfTotal: project.percentageOfTotal,
      status: project.status,
      priority: project.priority,
      id: project.id
    }))
    .sort((a, b) => b.employees - a.employees);

  const pieData = data.slice(0, 8); // Top 8 projects for pie chart
  const otherProjects = data.slice(8);
  const otherCount = otherProjects.reduce((sum, p) => sum + p.employees, 0);

  if (otherProjects.length > 0) {
    pieData.push({
      name: 'Other Projects',
      fullName: 'Other Projects',
      employees: otherCount,
      percentageOfTotal: (otherCount / totalEmployees) * 100,
      status: 'Mixed',
      priority: 'Various'
    });
  }

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
          <p className="text-xs text-[var(--muted)]">{subtitle}</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-1 bg-[var(--surface2)] rounded-lg p-1">
          <button
            onClick={() => setViewMode('bar')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === 'bar' 
                ? 'bg-green-500 text-white' 
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setViewMode('pie')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === 'pie' 
                ? 'bg-green-500 text-white' 
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Pie Chart
          </button>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-[var(--muted)]">No engagement data available</p>
        </div>
      ) : viewMode === 'bar' ? (
        <ResponsiveContainer width="100%" height={450}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              stroke="var(--muted)"
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              yAxisId="left"
              stroke="var(--muted)"
              label={{ value: 'Employees Assigned', angle: -90, position: 'insideLeft', fill: 'var(--muted)' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              stroke="var(--muted)"
              label={{ value: 'Percentage (%)', angle: 90, position: 'insideRight', fill: 'var(--muted)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="employees" 
              name="Employees Assigned" 
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
            <Bar 
              yAxisId="right"
              dataKey="percentageOfTotal" 
              name="% of Total Workforce" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <ResponsiveContainer width="100%" height={350} className="md:w-1/2">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={(props) => {
                  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
                  return (
                    <g>
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius + 10}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                      />
                      <text x={cx} y={cy - 20} textAnchor="middle" fill="var(--text)" fontSize={12}>
                        {payload.name}
                      </text>
                      <text x={cx} y={cy} textAnchor="middle" fill="var(--text)" fontSize={16} fontWeight="bold">
                        {payload.employees}
                      </text>
                      <text x={cx} y={cy + 20} textAnchor="middle" fill="var(--muted)" fontSize={10}>
                        employees
                      </text>
                    </g>
                  );
                }}
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="employees"
                onMouseEnter={onPieEnter}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend with percentages */}
          <div className="md:w-1/2 max-h-80 overflow-y-auto">
            <h4 className="text-sm font-semibold text-[var(--text)] mb-3">Project Breakdown</h4>
            <div className="space-y-2">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-[var(--surface2)] rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-sm text-[var(--text)]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-green-500">{item.employees}</span>
                    <span className="text-xs text-[var(--muted)] ml-1">
                      ({((item.employees / totalEmployees) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Statistics */}
      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-[var(--muted)]">Total Projects</p>
            <p className="text-xl font-bold text-green-500">{projects.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--muted)]">Projects with Assignments</p>
            <p className="text-xl font-bold text-blue-500">{data.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--muted)]">Avg Employees per Project</p>
            <p className="text-xl font-bold text-orange-500">
              {data.length ? (data.reduce((sum, p) => sum + p.employees, 0) / data.length).toFixed(1) : 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--muted)]">Most Engaged Project</p>
            <p className="text-sm font-semibold text-[var(--text)] truncate" title={data[0]?.fullName}>
              {data[0]?.name || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeEngagementChart;