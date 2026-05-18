import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface RadarChartProps {
  data: { subject: string; value: number; fullMark?: number }[];
  color?: string;
  size?: number;
}

export default function PlayerRadarChart({ data, color = '#10b981', size = 280 }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={size}>
      <RechartsRadar
        data={data}
      >
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
        />
        <Radar
          name="Attributi"
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#f9fafb',
          }}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
