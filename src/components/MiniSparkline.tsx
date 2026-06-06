import React from 'react';

interface MiniSparklineProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export default function MiniSparkline({ data, isPositive, width = 100, height = 30 }: MiniSparklineProps) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  // Map coordinates to SVG viewbox
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    // In SVG, y=0 is top, so we subtract scaled height from height
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = isPositive ? '#00c853' : '#ff5252';
  const fillColor = isPositive ? 'rgba(0, 200, 83, 0.06)' : 'rgba(255, 82, 82, 0.06)';

  // Build the closed path for the gradient fill
  const fillPoints = `0,${height} ${points} ${width},${height}`;


  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Gradient Fill */}
      <polygon points={fillPoints} fill={fillColor} />
      {/* Line */}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
