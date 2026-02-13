import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ProcessedContact } from '../../../types';
import { COLORS } from '../../../lib/constants';

interface ResponseTimelineProps {
  data: ProcessedContact[];
}

export const ResponseTimeline: React.FC<ResponseTimelineProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const validData = data
      .filter(c => c.responseTime && c.status !== 'No Response')
      .sort((a, b) => new Date(a.responseTime!).getTime() - new Date(b.responseTime!).getTime());

    return validData.map((_, index) => ({
      date: new Date(validData[index].responseTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
      timestamp: new Date(validData[index].responseTime!).getTime(),
      total: index + 1
    }));
  }, [data]);

  if (chartData.length === 0) return null;

  return (
    <div className="glass-card p-4 h-[300px] flex flex-col">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Response Timeline
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.Primary} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={COLORS.Primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
                dataKey="timestamp" 
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                tick={{ fontSize: 10, fill: '#6b7280' }} 
                tickLine={false}
                axisLine={false}
                minTickGap={50}
            />
            <YAxis 
                width={40}
                tick={{ fontSize: 10, fill: '#6b7280' }} 
                tickLine={false}
                axisLine={false}
            />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 500, color: COLORS.Primary }}
                formatter={(value: any) => [value, 'Responses']}
                labelStyle={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px', display: 'block' }}
                labelFormatter={(label) => new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
            />
            <Area 
                type="monotone" 
                dataKey="total" 
                stroke={COLORS.Primary} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
