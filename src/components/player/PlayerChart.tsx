"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Point = {
  createdAt: number;
  maxPoints: number;
};

function fmtX(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function PlayerChart({ data }: { data: Point[] }) {
  // Recharts любит стабильные данные; добавим name ключи
  const rows = data.map((p) => ({
    createdAt: p.createdAt,
    maxPoints: p.maxPoints,
    label: fmtX(p.createdAt),
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
            labelStyle={{ color: "rgba(255,255,255,0.8)" }}
            itemStyle={{ color: "white" }}
          />
          <Line type="monotone" dataKey="maxPoints" strokeWidth={3} dot={false} isAnimationActive />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
