import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ProcessedContact } from '../../../types';
import { COLORS, STATUS_ORDER } from '../../../lib/constants';

interface DemographicChartProps {
  data: ProcessedContact[];
  category: 'department' | 'location';
  title: string;
}

export const DemographicChart: React.FC<DemographicChartProps> = ({ data, category, title }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    const totals: Record<string, number> = {};

    data.forEach(c => {
      const key = c[category] || 'Unknown';
      if (!counts[key]) counts[key] = {};
      if (!totals[key]) totals[key] = 0;
      
      const status = c.status || 'No Response';
      counts[key][status] = (counts[key][status] || 0) + 1;
      totals[key]++;
    });

    const result = Object.keys(counts)
      .map(key => ({
        name: key,
        ...counts[key],
        total: totals[key]
      }))
      .sort((a, b) => b.total - a.total);

    return result;
  }, [data, category]);

  // Calculate dynamic height based on data items
  // Min height 200px, max height 600px, 50px per item + buffer
  const containerHeight = Math.min(Math.max(chartData.length * 50 + 60, 200), 600);



  return (
    <div 
      className="glass-card p-4 flex flex-col"
      style={{ height: containerHeight }}
    >
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex-shrink-0">
        {title}
      </h3>
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        <div style={{ height: Math.max(chartData.length * 50, 150) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              barSize={20}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                width={140}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "#f9fafb" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ fontSize: "11px", fontWeight: 500 }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                content={() => (
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    {STATUS_ORDER.map((status) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: COLORS[status as keyof typeof COLORS] }} 
                        />
                        <span className="text-[10px] font-medium text-gray-600">
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {STATUS_ORDER.map((status) => (
                <Bar
                  key={status}
                  dataKey={status}
                  stackId="a"
                  fill={COLORS[status as keyof typeof COLORS]}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
