import React, { useState } from 'react';
import { Line, Circle, Text, Group } from 'react-konva';
import { useMindmapStore } from '../../stores/mindmapStore';
import { ConnectionLabelEditor } from './ConnectionLabelEditor';
import type { Connection, Node, Position } from '../../types';

interface ConnectionLineProps {
  connection: Connection;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ connection }) => {
  const { selectConnection, updateConnection } = useMindmapStore();
  const nodes = useMindmapStore(state => state.nodes);
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  // Find the connected nodes
  const fromNode = nodes.find(node => node.id === connection.from);
  const toNode = nodes.find(node => node.id === connection.to);

  if (!fromNode || !toNode) {
    return null; // Don't render if nodes are missing
  }

  // Calculate connection points on node edges
  const getConnectionPoint = (node: Node, targetNode: Node): Position => {
    const fromCenter = {
      x: node.position.x + node.size.width / 2,
      y: node.position.y + node.size.height / 2,
    };
    const toCenter = {
      x: targetNode.position.x + targetNode.size.width / 2,
      y: targetNode.position.y + targetNode.size.height / 2,
    };

    // Calculate direction vector
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return fromCenter;

    // Normalize direction
    const unitX = dx / distance;
    const unitY = dy / distance;

    // Calculate edge point (offset by half node size)
    const edgeOffset = {
      x: unitX * (node.size.width / 2),
      y: unitY * (node.size.height / 2),
    };

    return {
      x: fromCenter.x + edgeOffset.x,
      y: fromCenter.y + edgeOffset.y,
    };
  };

  const startPoint = getConnectionPoint(fromNode, toNode);
  const endPoint = getConnectionPoint(toNode, fromNode);

  // Create smooth curve using quadratic bezier
  const controlPoint = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2 - 50, // Curve upward slightly
  };

  // Calculate arrow direction and position
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const angle = Math.atan2(dy, dx);
  
  // Arrow head size
  const arrowLength = 12;
  
  // Calculate arrow head points
  const arrowTip = endPoint;
  const arrowBase1 = {
    x: arrowTip.x - arrowLength * Math.cos(angle - Math.PI / 6),
    y: arrowTip.y - arrowLength * Math.sin(angle - Math.PI / 6),
  };
  const arrowBase2 = {
    x: arrowTip.x - arrowLength * Math.cos(angle + Math.PI / 6),
    y: arrowTip.y - arrowLength * Math.sin(angle + Math.PI / 6),
  };

  // Calculate label position (middle of the line)
  const labelPosition = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2 - 25,
  };

  // Line style based on selection state - improved visibility
  const strokeColor = connection.isSelected ? '#007bff' : '#495057';
  const strokeWidth = connection.isSelected ? 3 : 2.5;
  const opacity = connection.isSelected ? 1 : 0.9;

  const handleClick = () => {
    selectConnection(connection.id);
  };

  const handleDoubleClick = () => {
    setIsEditingLabel(true);
  };

  const handleLabelSave = (label: string) => {
    updateConnection(connection.id, { label });
    setIsEditingLabel(false);
  };

  const handleLabelCancel = () => {
    setIsEditingLabel(false);
  };

  return (
    <>
      {/* Main connection line */}
      <Line
        points={[
          startPoint.x, startPoint.y,
          controlPoint.x, controlPoint.y,
          endPoint.x, endPoint.y,
        ]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        tension={0.5} // Makes the line smoother
        lineCap="round"
        lineJoin="round"
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        shadowBlur={connection.isSelected ? 8 : 0}
        shadowColor="rgba(0, 123, 255, 0.3)"
        shadowOffsetY={connection.isSelected ? 2 : 0}
        // Make line easier to click
        hitStrokeWidth={strokeWidth + 10}
        style={{ cursor: 'pointer' }}
      />
      
      {/* Triangular arrowhead at the end */}
      <Line
        points={[
          arrowTip.x, arrowTip.y,
          arrowBase1.x, arrowBase1.y,
          arrowBase2.x, arrowBase2.y,
          arrowTip.x, arrowTip.y,
        ]}
        fill={strokeColor}
        stroke={strokeColor}
        strokeWidth={1}
        opacity={opacity}
        closed={true}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        style={{ cursor: 'pointer' }}
      />

      {/* Connection label */}
      {connection.label && (
        <Group>
          {/* Label background */}
          <Circle
            x={labelPosition.x}
            y={labelPosition.y}
            radius={connection.label.length * 3 + 8}
            fill="white"
            stroke={strokeColor}
            strokeWidth={1}
            opacity={0.9}
          />
          {/* Label text */}
          <Text
            text={connection.label}
            x={labelPosition.x}
            y={labelPosition.y}
            fontSize={12}
            fontFamily="Arial, sans-serif"
            fill={strokeColor}
            align="center"
            verticalAlign="middle"
            offsetX={connection.label.length * 3}
            offsetY={6}
          />
        </Group>
      )}
      
      {/* Connection point indicator when selected */}
      {connection.isSelected && (
        <>
          <Circle
            x={startPoint.x}
            y={startPoint.y}
            radius={4}
            fill="#28a745"
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Circle
            x={endPoint.x}
            y={endPoint.y}
            radius={4}
            fill="#dc3545"
            stroke="#ffffff"
            strokeWidth={2}
          />
        </>
      )}

      {/* Label editor */}
      {isEditingLabel && (
        <ConnectionLabelEditor
          position={labelPosition}
          currentLabel={connection.label}
          onSave={handleLabelSave}
          onCancel={handleLabelCancel}
        />
      )}
    </>
  );
};