
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { LibraryStats } from '../types';

interface StatsPanelProps {
  stats: LibraryStats[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  if (stats.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
        Upload files to see distribution
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
      <h2 className="text-lg font-bold mb-4 text-slate-200">Asset Distribution</h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stats}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {stats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
