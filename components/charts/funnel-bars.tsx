"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

export function FunnelBars({
  data,
  height = 280,
  color = "#0B1F3A",
}: {
  data: Array<{ stage: string; count: number }>;
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart layout="vertical" data={data} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, max]} hide />
          <YAxis type="category" dataKey="stage" fontSize={12} width={150} />
          <Tooltip />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={1 - i * 0.12} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
