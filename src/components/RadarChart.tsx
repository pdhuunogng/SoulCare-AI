import React from 'react';

interface RadarChartProps {
  depressionPct: number;
  anxietyPct: number;
  stressPct: number;
  sleepPct: number;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  depressionPct,
  anxietyPct,
  stressPct,
  sleepPct,
  size = 280,
}) => {
  const center = size / 2;
  const radius = size * 0.38;

  // 4 Axes: Top (Depression), Right (Anxiety), Bottom (Stress), Left (Sleep)
  const axes = [
    { label: 'Khí sắc (PHQ)', value: depressionPct, angle: -Math.PI / 2, color: '#f87171' },
    { label: 'Lo âu (GAD)', value: anxietyPct, angle: 0, color: '#fb923c' },
    { label: 'Căng thẳng (PSS)', value: stressPct, angle: Math.PI / 2, color: '#facc15' },
    { label: 'Giấc ngủ (PSQI)', value: sleepPct, angle: Math.PI, color: '#60a5fa' },
  ];

  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (angle: number, distance: number) => {
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  const points = axes.map((axis) => {
    const clampedVal = Math.max(5, Math.min(100, axis.value));
    const dist = (clampedVal / 100) * radius;
    return getCoordinates(axis.angle, dist);
  });

  const polygonPointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="overflow-visible select-none">
        {/* Background Grids */}
        {levels.map((lvl, idx) => {
          const gridPoints = axes
            .map((axis) => {
              const pt = getCoordinates(axis.angle, radius * lvl);
              return `${pt.x},${pt.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={`grid-${idx}`}
              points={gridPoints}
              fill={idx === levels.length - 1 ? 'rgba(103, 199, 108, 0.05)' : 'none'}
              stroke="currentColor"
              strokeWidth="1"
              className="text-slate-200 dark:text-slate-700"
              strokeDasharray={idx < 3 ? '3 3' : 'none'}
            />
          );
        })}

        {/* Axis Lines */}
        {axes.map((axis, i) => {
          const endPt = getCoordinates(axis.angle, radius);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={endPt.x}
              y2={endPt.y}
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-slate-300 dark:text-slate-700"
            />
          );
        })}

        {/* Value Polygon */}
        <polygon
          points={polygonPointsStr}
          fill="rgba(103, 199, 108, 0.35)"
          stroke="#10b981"
          strokeWidth="2.5"
          className="transition-all duration-700 ease-out"
        />

        {/* Point Circles & Value Labels */}
        {points.map((p, i) => (
          <g key={`pt-${i}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="2"
              className="shadow-md"
            />
          </g>
        ))}

        {/* Axis Labels */}
        {axes.map((axis, i) => {
          const labelDist = radius + 26;
          const labelPt = getCoordinates(axis.angle, labelDist);
          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          if (axis.angle === 0) textAnchor = 'start';
          if (axis.angle === Math.PI) textAnchor = 'end';

          return (
            <g key={`lbl-${i}`}>
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor={textAnchor}
                className="text-[11px] font-semibold fill-slate-700 dark:fill-slate-200"
                dominantBaseline="central"
              >
                {axis.label}
              </text>
              <text
                x={labelPt.x}
                y={labelPt.y + 13}
                textAnchor={textAnchor}
                className="text-[10px] font-bold fill-emerald-600 dark:fill-emerald-400"
                dominantBaseline="central"
              >
                {Math.round(axis.value)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
