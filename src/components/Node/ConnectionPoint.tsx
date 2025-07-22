import React from 'react';
import { Circle } from 'react-konva';
import type { ConnectionPoint } from '../../types';

interface ConnectionPointProps {
  connectionPoint: ConnectionPoint;
  nodeSize: { width: number; height: number };
  isHovered: boolean;
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseDown: (e: any) => void;
  onMouseUp: (e: any) => void;
}

export const ConnectionPointComponent: React.FC<ConnectionPointProps> = ({
  connectionPoint,
  nodeSize,
  isHovered,
  isActive,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
}) => {
  // Calculate position based on node size and connection point position
  const getPosition = () => {
    const { position } = connectionPoint;
    const { width, height } = nodeSize;
    
    switch (position) {
      case 'top':
        return { x: width / 2, y: 0 };
      case 'right':
        return { x: width, y: height / 2 };
      case 'bottom':
        return { x: width / 2, y: height };
      case 'left':
        return { x: 0, y: height / 2 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const pos = getPosition();
  const radius = isHovered ? 8 : 6;
  const fillColor = isActive ? '#ff6b6b' : isHovered ? '#4ecdc4' : '#dee2e6';
  const strokeColor = isActive ? '#e74c3c' : isHovered ? '#26d0ce' : '#adb5bd';

  return (
    <Circle
      x={pos.x}
      y={pos.y}
      radius={radius}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={2}
      draggable={false}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      shadowBlur={isHovered ? 8 : 4}
      shadowColor="rgba(0, 0, 0, 0.3)"
      shadowOffsetY={2}
      // Add connection point ID for detection
      connectionPointId={connectionPoint.id}
      // Change cursor on hover
      style={{ cursor: 'crosshair' }}
    />
  );
};