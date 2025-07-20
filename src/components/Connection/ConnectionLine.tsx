import React, { useState } from 'react';
import { Line, Circle, Text, Group, Rect } from 'react-konva';
import { useMindmapStore } from '../../stores/mindmapStore';
import type { Connection, Node, Position } from '../../types';

interface ConnectionLineProps {
  connection: Connection;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ connection }) => {
  const { selectConnection, startEditingConnectionLabel, startEditingConnectionEndpoint, updateConnectionEndpoint, cancelConnectionEndpointEdit } = useMindmapStore();
  const nodes = useMindmapStore(state => state.nodes);
  const canvasState = useMindmapStore(state => state.canvas);
  
  // Component rendered efficiently

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
  const strokeWidth = connection.isSelected ? 4 : 2.5;
  const opacity = connection.isSelected ? 1 : 0.8;
  const shadowBlur = connection.isSelected ? 12 : 0;
  const shadowColor = connection.isSelected ? 'rgba(0, 123, 255, 0.5)' : 'transparent';

  const handleClick = (e: any) => {
    // Stop event propagation to prevent canvas stage from processing this click
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.preventDefault();
    }
    
    selectConnection(connection.id);
  };

  const handleDoubleClick = (e: any) => {
    // Prevent event bubbling to canvas
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.preventDefault();
    }
    
    // Only start label editing if not in connection endpoint editing mode
    if (!canvasState.isEditingConnection) {
      selectConnection(connection.id);
      startEditingConnectionLabel(connection.id);
    }
  };

  // Handle endpoint editing
  const handleStartPointClick = (e: any) => {
    // Stop all event propagation aggressively
    e.cancelBubble = true;
    e.stopPropagation?.();
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.stopImmediatePropagation();
      e.evt.preventDefault();
    }
    
    // Also stop Konva's internal event propagation
    if (e.target) {
      e.target.stopBubble = true;
    }
    
    // Call the editing function
    startEditingConnectionEndpoint(connection.id, 'start');
    
    // Prevent any further processing
    return false;
  };

  const handleEndPointClick = (e: any) => {
    // Stop all event propagation aggressively
    e.cancelBubble = true;
    e.stopPropagation?.();
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.stopImmediatePropagation();
      e.evt.preventDefault();
    }
    
    // Also stop Konva's internal event propagation
    if (e.target) {
      e.target.stopBubble = true;
    }
    
    // Call the editing function
    startEditingConnectionEndpoint(connection.id, 'end');
    
    // Prevent any further processing
    return false;
  };


  return (
    <Group
      name="connection-group"
      listening={true}
    >
      {/* Enhanced invisible clickable area for better hit detection */}
      <Line
        points={[
          startPoint.x, startPoint.y,
          controlPoint.x, controlPoint.y,
          endPoint.x, endPoint.y,
        ]}
        stroke="transparent"
        strokeWidth={30} // Increased hit area for better UX
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        listening={true}
        name="connection-hitarea"
        perfectDrawEnabled={false}
      />
      
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
        shadowBlur={shadowBlur}
        shadowColor={shadowColor}
        shadowOffsetY={connection.isSelected ? 3 : 0}
        listening={false} // Disable events on visual line
        name="connection-visual"
        perfectDrawEnabled={false}
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
        strokeWidth={connection.isSelected ? 2 : 1}
        opacity={opacity}
        closed={true}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        shadowBlur={shadowBlur}
        shadowColor={shadowColor}
        shadowOffsetY={connection.isSelected ? 3 : 0}
        listening={true} // Explicitly enable event listening
        name="connection-arrow" // For debugging
        perfectDrawEnabled={false} // Improve performance
      />

      {/* Connection label - pure text only */}
      {connection.label && (
        <Text
          text={connection.label}
          x={labelPosition.x}
          y={labelPosition.y}
          fontSize={14}
          fontFamily="Arial, sans-serif"
          fontStyle="bold"
          fill={strokeColor}
          align="center"
          verticalAlign="middle"
          offsetX={connection.label.length * 4}
          offsetY={7}
        />
      )}
      
      {/* Connection editing handles - higher priority than double-click */}
      {connection.isSelected && !canvasState.isEditingConnection && (
        <Group name="connection-handles" listening={true}>
          {/* Invisible larger hit areas for better click detection */}
          <Circle
            x={startPoint.x}
            y={startPoint.y}
            radius={25} // Increased hit area
            fill="transparent"
            onClick={handleStartPointClick}
            onTap={handleStartPointClick}
            onMouseDown={handleStartPointClick}
            listening={true}
            name="start-handle-hitarea"
          />
          <Circle
            x={endPoint.x}
            y={endPoint.y}
            radius={25} // Increased hit area
            fill="transparent"
            onClick={handleEndPointClick}
            onTap={handleEndPointClick}
            onMouseDown={handleEndPointClick}
            listening={true}
            name="end-handle-hitarea"
          />
          
          {/* Visual handle circles */}
          <Circle
            x={startPoint.x}
            y={startPoint.y}
            radius={12}
            fill={"#28a745"}
            stroke="#ffffff"
            strokeWidth={2}
            shadowBlur={4}
            shadowColor="rgba(0,0,0,0.3)"
            listening={false}
            name="start-handle-visual"
          />
          
          <Circle
            x={endPoint.x}
            y={endPoint.y}
            radius={12}
            fill={"#dc3545"}
            stroke="#ffffff"
            strokeWidth={2}
            shadowBlur={4}
            shadowColor="rgba(0,0,0,0.3)"
            listening={false}
            name="end-handle-visual"
          />
        </Group>
      )}
      
      {/* Show editing handles when in editing mode */}
      {canvasState.isEditingConnection && canvasState.editingConnectionId === connection.id && (
        <Group name="connection-editing-handles" listening={false}>
          <Circle
            x={startPoint.x}
            y={startPoint.y}
            radius={15}
            fill={canvasState.editingEndpoint === 'start' ? "#ffc107" : "#28a745"}
            stroke="#ffffff"
            strokeWidth={3}
            shadowBlur={6}
            shadowColor="rgba(255,193,7,0.5)"
            listening={false}
            name="start-handle-editing"
          />
          
          <Circle
            x={endPoint.x}
            y={endPoint.y}
            radius={15}
            fill={canvasState.editingEndpoint === 'end' ? "#ffc107" : "#dc3545"}
            stroke="#ffffff"
            strokeWidth={3}
            shadowBlur={6}
            shadowColor="rgba(255,193,7,0.5)"
            listening={false}
            name="end-handle-editing"
          />
        </Group>
      )}

    </Group>
  );
};