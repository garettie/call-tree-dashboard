import type { FC } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { COLORS } from '../../../lib/constants';

interface ResponseDonutProps {
  responded: number;
  total: number;
}

export const ResponseDonut: FC<ResponseDonutProps> = ({ responded, total }) => {
  const percentage = total > 0 ? (responded / total) * 100 : 0;
  const pending = total - responded;

  const data = [
    { name: 'Responded', value: responded },
    { name: 'Pending', value: pending },
  ];

  return (
    <div className="glass-card p-4 h-[300px] flex flex-col">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Response Rate
      </h3>
      <div className="flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={COLORS.Primary} />
              <Cell fill={COLORS.Pending} />
            </Pie>
            <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 itemStyle={{ fontSize: '12px', fontWeight: 500 }}
            />
            <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 500, color: '#4b5563' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
            <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{percentage.toFixed(0)}%</div>
            </div>
        </div>
      </div>
    </div>
  );
};
