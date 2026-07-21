import React from 'react';

interface MiniSparklineProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export default function MiniSparkline({ data, isPositive, width = 100, height = 30 }: MiniSparklineProps) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const cleanData = data.filter(val => typeof val === 'number' && !isNaN(val));
  if (cleanData.length === 0) return null;

  const min = Math.min(...cleanData);
  const max = Math.max(...cleanData);
  const range = max - min === 0 ? 1 : max - min;

  // Map coordinates to SVG viewbox
  const points = cleanData.map((val, index) => {
    const x = (index / (cleanData.length - 1)) * width;
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

export function generateMockSparkline(symbol: string, isPositive: boolean): number[] {
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const points: number[] = [];
  let currentVal = 100;
  points.push(currentVal);
  for (let i = 0; i < 9; i++) {
    const change = ((seed + i * 3) % 15) - 7;
    currentVal += change;
    points.push(currentVal);
  }
  if (isPositive && points[points.length - 1] < points[0]) {
    points[points.length - 1] = points[0] + 12;
  } else if (!isPositive && points[points.length - 1] > points[0]) {
    points[points.length - 1] = points[0] - 12;
  }
  return points;
}

