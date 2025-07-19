import React from 'react';
import { Line, Circle } from 'react-konva';
import type { Position } from '../../types';

interface DashedArrowProps {
  startPoint: Position;
  endPoint: Position;
}

export const DashedArrow: React.FC<DashedArrowProps> = ({ startPoint, endPoint }) => {
  // Calculate arrow direction for arrowhead
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return null;
  
  // Arrow style
  const strokeColor = '#6c757d';
  const strokeWidth = 2;
  const dashPattern = [10, 5]; // 10px line, 5px gap

  return (
    <>
      {/* Dashed line */}
      <Line
        points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        dash={dashPattern}
        lineCap="round"
        opacity={0.7}
        // Disable interactions for preview arrow
        listening={false}
      />
      
      {/* Arrowhead at the end */}
      <Circle
        x={endPoint.x}
        y={endPoint.y}
        radius={strokeWidth + 1}
        fill={strokeColor}
        opacity={0.7}
        listening={false}
      />
      
      {/* Start point indicator */}
      <Circle
        x={startPoint.x}
        y={startPoint.y}
        radius={strokeWidth}
        fill={strokeColor}
        opacity={0.5}
        listening={false}
      />
    </>
  );
};