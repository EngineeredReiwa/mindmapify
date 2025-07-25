import React from 'react';
import { Line, Circle, Text, Group, Shape } from 'react-konva';
import { useMindmapStore } from '../../stores/mindmapStore';
import { getConnectionPointPosition, determineConnectionSides } from '../../utils/connectionUtils';
import type { Connection, Position } from '../../types';

interface ConnectionLineProps {
  connection: Connection;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ connection }) => {
  const { selectConnection, startEditingConnectionLabel, startEditingConnectionEndpoint } = useMindmapStore();
  const nodes = useMindmapStore(state => state.nodes);
  const canvasState = useMindmapStore(state => state.canvas);
  
  // Track single click for preventing double-click conflicts
  const [lastClickTime, setLastClickTime] = React.useState(0);
  
  // Component rendered efficiently

  // Find the connected nodes
  const fromNode = nodes.find(node => node.id === connection.from);
  const toNode = nodes.find(node => node.id === connection.to);

  if (!fromNode || !toNode) {
    return null; // Don't render if nodes are missing
  }

  // Calculate fixed connection points based on stored sides or determine them
  const getFixedConnectionPoints = (): { startPoint: Position; endPoint: Position } => {
    let fromSide = connection.fromSide;
    let toSide = connection.toSide;
    
    // If sides are not stored (legacy connections), determine them now
    if (!fromSide || !toSide) {
      const sides = determineConnectionSides(fromNode, toNode);
      fromSide = sides.fromSide;
      toSide = sides.toSide;
    }
    
    const startPoint = getConnectionPointPosition(fromNode, fromSide);
    const endPoint = getConnectionPointPosition(toNode, toSide);
    
    return { startPoint, endPoint };
  };

  const { startPoint, endPoint } = getFixedConnectionPoints();

  // Create gentle curve using quadratic bezier
  const controlPoint = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2 - 20, // Gentle curve, reduced from 50
  };

  // Calculate arrow direction using curve tangent at end point
  // For quadratic bezier, tangent at end point is direction from control point to end point
  const dx = endPoint.x - controlPoint.x;
  const dy = endPoint.y - controlPoint.y;
  const angle = Math.atan2(dy, dx);
  
  // Arrow head size - visible but not too large
  const arrowLength = 8;
  const arrowOffset = 6; // Enough offset to clear connection points
  
  // Calculate arrow tip position with offset to avoid connection point overlap
  const arrowTip = {
    x: endPoint.x - arrowOffset * Math.cos(angle),
    y: endPoint.y - arrowOffset * Math.sin(angle),
  };
  
  // Calculate arrow head points with wider angle for better visibility
  const arrowBase1 = {
    x: arrowTip.x - arrowLength * Math.cos(angle - Math.PI / 5),
    y: arrowTip.y - arrowLength * Math.sin(angle - Math.PI / 5),
  };
  const arrowBase2 = {
    x: arrowTip.x - arrowLength * Math.cos(angle + Math.PI / 5),
    y: arrowTip.y - arrowLength * Math.sin(angle + Math.PI / 5),
  };

  // Calculate label position (middle of the gentle curve)
  const labelPosition = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2 - 30, // Adjusted for gentle curve
  };

  // Line style based on selection state - adjusted for editing mode
  const isEditingThis = canvasState.isEditingConnection && canvasState.editingConnectionId === connection.id;
  const strokeColor = connection.isSelected ? '#007bff' : '#495057';
  const strokeWidth = isEditingThis ? 2 : (connection.isSelected ? 3 : 2);
  const opacity = 1; // Always full opacity for consistent color
  const shadowBlur = connection.isSelected ? 8 : 0;
  const shadowColor = connection.isSelected ? 'rgba(0, 123, 255, 0.3)' : 'transparent';

  const handleClick = (e: any) => {
    // Stop event propagation to prevent canvas stage from processing this click
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.preventDefault();
    }
    
    // Prevent single click immediately after double click
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 500) {
      return;
    }
    
    // Only select if not currently editing a label to prevent interference
    const isEditingLabel = connection.isEditingLabel;
    if (!isEditingLabel) {
      selectConnection(connection.id);
    }
  };

  const handleDoubleClick = (e: any) => {
    // Prevent event bubbling to canvas
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.preventDefault();
    }
    
    console.log('🎯 Connection double-click detected on:', connection.id);
    setLastClickTime(Date.now()); // Record double-click time
    
    // Only start label editing if not in connection endpoint editing mode
    if (!canvasState.isEditingConnection) {
      // Select the connection first, then start editing
      selectConnection(connection.id);
      // Small delay to ensure selection state updates
      setTimeout(() => {
        startEditingConnectionLabel(connection.id);
      }, 50);
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
        strokeWidth={40} // Further increased hit area for better double-click detection
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
        hitStrokeWidth={40} // Explicit hit stroke width
      />
      
      {/* Main connection line - gentle curve extended to arrow base */}
      <Line
        points={[
          startPoint.x, startPoint.y,
          controlPoint.x, controlPoint.y,
          (arrowBase1.x + arrowBase2.x) / 2, (arrowBase1.y + arrowBase2.y) / 2,
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
      
      {/* Triangular arrowhead using Shape for clean rendering */}
      <Shape
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.moveTo(arrowTip.x, arrowTip.y);
          context.lineTo(arrowBase1.x, arrowBase1.y);
          context.lineTo(arrowBase2.x, arrowBase2.y);
          context.closePath();
          context.fillStrokeShape(shape);
        }}
        fill={strokeColor}
        stroke=""
        strokeWidth={0}
        opacity={1}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        listening={true}
        name="connection-arrow"
        perfectDrawEnabled={false}
      />

      {/* Label area - always present for double-click, even without label */}
      <Group>
        {/* Invisible clickable area for label - always present */}
        <Shape
          x={labelPosition.x}
          y={labelPosition.y}
          sceneFunc={(context, shape) => {
            const textWidth = connection.label ? connection.label.length * 10 + 30 : 60; // Default width if no label
            const textHeight = 40;
            context.beginPath();
            context.rect(-textWidth/2, -textHeight/2, textWidth, textHeight);
            context.closePath();
            context.fillStrokeShape(shape);
          }}
          fill="transparent"
          stroke="transparent"
          onDblClick={handleDoubleClick}
          onDblTap={handleDoubleClick}
          listening={true}
          name="label-hitarea"
        />
        
        {/* Visual label text - only if label exists */}
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
            listening={false}
          />
        )}
      </Group>
      
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
      
      {/* Show editing handles when in editing mode - smaller size */}
      {canvasState.isEditingConnection && canvasState.editingConnectionId === connection.id && (
        <Group name="connection-editing-handles" listening={false}>
          <Circle
            x={startPoint.x}
            y={startPoint.y}
            radius={8}
            fill={canvasState.editingEndpoint === 'start' ? "#ffc107" : "#28a745"}
            stroke="#ffffff"
            strokeWidth={1}
            shadowBlur={3}
            shadowColor="rgba(255,193,7,0.3)"
            listening={false}
            name="start-handle-editing"
          />
          
          <Circle
            x={endPoint.x}
            y={endPoint.y}
            radius={8}
            fill={canvasState.editingEndpoint === 'end' ? "#ffc107" : "#dc3545"}
            stroke="#ffffff"
            strokeWidth={1}
            shadowBlur={3}
            shadowColor="rgba(255,193,7,0.3)"
            listening={false}
            name="end-handle-editing"
          />
        </Group>
      )}

    </Group>
  );
};