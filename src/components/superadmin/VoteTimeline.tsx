"use client";

import { useMemo } from "react";
import { bucketVotesByMinute } from "@/lib/db";
import type { VoteLogEntry } from "@/lib/types";

export function VoteTimeline({ entries }: { entries: VoteLogEntry[] }) {
  const buckets = useMemo(() => bucketVotesByMinute(entries), [entries]);

  if (buckets.length === 0) {
    return (
      <p className="text-sm font-semibold text-ink-soft">
        Aún no hay votos para graficar.
      </p>
    );
  }

  const max = Math.max(1, ...buckets.map((b) => b.total));
  const width = 600;
  const height = 140;
  const chartHeight = 110;
  const gap = 3;
  const barWidth = Math.max(2, width / buckets.length - gap);
  const showLabels = buckets.length <= 12;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full rounded-2xl bg-white/60"
        role="img"
        aria-label="Votos por minuto"
      >
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={chartHeight - chartHeight * ratio}
            y2={chartHeight - chartHeight * ratio}
            stroke="#e5e7eb"
            strokeDasharray="4 4"
          />
        ))}
        {buckets.map((bucket, index) => {
          const x = index * (barWidth + gap) + 2;
          const boyHeight = (bucket.boy / max) * chartHeight;
          const girlHeight = (bucket.girl / max) * chartHeight;
          return (
            <g key={bucket.label}>
              <title>
                {bucket.label} · {bucket.boy}💙 {bucket.girl}💗
              </title>
              <rect
                x={x}
                y={chartHeight - boyHeight}
                width={barWidth}
                height={boyHeight}
                rx={2}
                fill="#6fb3dd"
              />
              <rect
                x={x}
                y={chartHeight - boyHeight - girlHeight}
                width={barWidth}
                height={girlHeight}
                rx={2}
                fill="#f5a3c3"
              />
              {showLabels && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#8b95a5"
                >
                  {bucket.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-center text-xs font-semibold text-ink-soft">
        Votos registrados por minuto (💙 niño · 💗 niña)
      </p>
    </div>
  );
}
