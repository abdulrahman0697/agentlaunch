"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
  Label,
} from "recharts";

export interface FIPoint {
  name: string;
  feasibility: number;
  impact: number;
}

export function FeasibilityImpactScatter({
  points,
  color = "#0B1F3A",
  height = 360,
}: {
  points: FIPoint[];
  color?: string;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="feasibility"
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            fontSize={12}
          >
            <Label value="Feasibility" position="insideBottom" offset={-8} fontSize={12} />
          </XAxis>
          <YAxis type="number" dataKey="impact" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} fontSize={12}>
            <Label value="Impact" angle={-90} position="insideLeft" fontSize={12} />
          </YAxis>
          <ZAxis range={[200, 200]} />
          <ReferenceLine x={5} stroke="#cbd5e1" strokeDasharray="3 3" />
          <ReferenceLine y={5} stroke="#cbd5e1" strokeDasharray="3 3" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const p = payload[0].payload as FIPoint;
                return (
                  <div className="rounded-md border bg-white p-2 text-xs shadow">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-slate-500">
                      feasibility {p.feasibility} · impact {p.impact}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter
            data={points}
            fill={color}
            shape={(props: { cx?: number; cy?: number; payload?: FIPoint }) => {
              const { cx, cy, payload } = props;
              if (cx == null || cy == null || !payload) return <g />;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={9} fill={color} fillOpacity={0.85} />
                  <text x={cx + 12} y={cy + 4} fontSize={11} fill="#0f172a">
                    {payload.name}
                  </text>
                </g>
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
