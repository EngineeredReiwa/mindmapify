import React, { useState, useEffect } from 'react';
import { Rect, Text, Group } from 'react-konva';
import { useMindmapStore } from '../../stores/mindmapStore';
import { ConnectionPointComponent } from './ConnectionPoint';
import type { Node, ConnectionPoint } from '../../types';

interface NodeComponentProps {
  node: Node;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({ node }) => {
  const { updateNode, selectNode, startEditing, toggleNodeSelection, setHoveredConnectionPoint, setActiveConnectionPoint } = useMindmapStore();
  const selectedNodeIds = useMindmapStore(state => state.selectedNodeIds);
  const canvasState = useMindmapStore(state => state.canvas);
  
  // ダブルクリック検出用の状態
  const [lastClickTime, setLastClickTime] = useState(0);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // 複数ノードドラッグ用の状態
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null);
  const [otherNodesStartPositions, setOtherNodesStartPositions] = useState<Map<string, {x: number, y: number}>>(new Map());
  
  // マルチセレクト後のドラッグ防止用の状態
  const [lastMultiSelectTime, setLastMultiSelectTime] = useState(0);
  const [isDragAllowed, setIsDragAllowed] = useState(true);

  const handleClick = (e: any) => {
    // Prevent event bubbling to canvas
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.preventDefault();
    }
    
    // Capture modifier keys immediately
    const isCtrlOrCmd = e.evt && (e.evt.ctrlKey || e.evt.metaKey);
    
    // If Ctrl/Cmd is held, toggle selection
    if (isCtrlOrCmd) {
      toggleNodeSelection(node.id);
      setLastMultiSelectTime(Date.now()); // Record multi-select time
      setIsDragAllowed(false); // Disable drag immediately
      // Re-enable drag after a short delay
      setTimeout(() => {
        setIsDragAllowed(true);
      }, 300);
      return;
    }
    
    // ダブルクリック検出
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    // ダブルクリック判定（400ms以内の連続クリック）
    if (timeDiff < 400) {
      console.log('🚫 Double-click detected - ignoring to prevent edit issues');
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        setClickTimeout(null);
      }
      setLastClickTime(currentTime);
      return;
    }
    
    setLastClickTime(currentTime);
    
    // シングルクリック処理を少し遅延
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSingleClick();
      setClickTimeout(null);
    }, 200);
    
    setClickTimeout(timeout);
  };

  const handleSingleClick = () => {
    // 1クリックで選択 + 編集開始
    console.log('Node clicked, starting edit');
    selectNode(node.id);
    startEditing(node.id);
  };

  const handleDoubleClick = () => {
    // Double click is handled by single click logic
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
      // Reset connection point states on unmount if this node owns them
      if (canvasState.hoveredConnectionPoint?.includes(node.id)) {
        setHoveredConnectionPoint(undefined);
      }
      if (canvasState.activeConnectionPoint?.includes(node.id)) {
        setActiveConnectionPoint(undefined);
      }
    };
  }, [clickTimeout, node.id, canvasState.hoveredConnectionPoint, canvasState.activeConnectionPoint, setHoveredConnectionPoint, setActiveConnectionPoint]);
  
  // Reset active connection point when connection state changes
  useEffect(() => {
    if (!canvasState.isConnecting) {
      setActiveConnectionPoint(undefined);
    }
  }, [canvasState.isConnecting, setActiveConnectionPoint]);

  // Generate connection points if they don't exist
  const getConnectionPoints = (): ConnectionPoint[] => {
    if (node.connectionPoints && node.connectionPoints.length > 0) {
      return node.connectionPoints;
    }
    
    // Create default connection points on all four sides
    return [
      { id: `${node.id}-top`, nodeId: node.id, position: 'top' },
      { id: `${node.id}-right`, nodeId: node.id, position: 'right' },
      { id: `${node.id}-bottom`, nodeId: node.id, position: 'bottom' },
      { id: `${node.id}-left`, nodeId: node.id, position: 'left' },
    ];
  };

  const connectionPoints = getConnectionPoints();

  // Connection point event handlers
  const handleConnectionPointMouseEnter = (pointId: string) => {
    setHoveredConnectionPoint(pointId);
    
    // During connection endpoint editing, show potential target
    if (canvasState.isEditingConnection) {
      console.log('🎯 Hovering over potential connection target:', pointId);
    }
  };

  const handleConnectionPointMouseLeave = () => {
    setHoveredConnectionPoint(undefined);
  };

  // Connection point position calculation
  const getAbsoluteConnectionPointPosition = (pointId: string): { x: number; y: number } => {
    const point = connectionPoints.find(p => p.id === pointId);
    if (!point) return { x: 0, y: 0 };
    
    const { width, height } = node.size;
    let localPos = { x: 0, y: 0 };
    
    switch (point.position) {
      case 'top':
        localPos = { x: width / 2, y: 0 };
        break;
      case 'right':
        localPos = { x: width, y: height / 2 };
        break;
      case 'bottom':
        localPos = { x: width / 2, y: height };
        break;
      case 'left':
        localPos = { x: 0, y: height / 2 };
        break;
    }
    
    return {
      x: node.position.x + localPos.x,
      y: node.position.y + localPos.y,
    };
  };

  const handleConnectionPointMouseDown = (pointId: string, e: any) => {
    e.cancelBubble = true;
    setActiveConnectionPoint(pointId);
    
    // Don't start new connection if we're in editing mode
    if (!canvasState.isEditingConnection) {
      console.log('🔗 Starting new connection from:', pointId);
      const absolutePosition = getAbsoluteConnectionPointPosition(pointId);
      useMindmapStore.getState().startConnection(pointId, absolutePosition);
    } else {
      console.log('🔧 In editing mode, not starting new connection');
    }
  };

  const handleConnectionPointMouseUp = (pointId: string, e: any) => {
    e.cancelBubble = true;
    
    // Get current canvas state
    const canvasState = useMindmapStore.getState().canvas;
    
    // Handle connection endpoint editing
    if (canvasState.isEditingConnection) {
      console.log('🔧 Connection endpoint editing - dropping on point:', pointId);
      const targetNodeId = pointId.split('-').slice(0, -1).join('-');
      useMindmapStore.getState().updateConnectionEndpoint(canvasState.editingConnectionId!, targetNodeId);
      return;
    }
    
    // Handle connection creation
    if (canvasState.isConnecting && canvasState.connectionStartPoint !== pointId) {
      useMindmapStore.getState().endConnection(pointId);
    } else if (canvasState.isConnecting) {
      useMindmapStore.getState().endConnection();
    }
    
    setActiveConnectionPoint(undefined);
  };

  const handleDragStart = (e: any) => {
    // Prevent dragging if Ctrl/Cmd is held (selection mode)
    if (e.evt && (e.evt.ctrlKey || e.evt.metaKey)) {
      e.target.stopDrag();
      return;
    }
    
    // Additional check for drag allowed state
    if (!isDragAllowed) {
      console.log('🚫 Drag not allowed - in multi-select mode');
      e.target.stopDrag();
      return;
    }
    
    // Prevent stage from dragging when dragging nodes
    const stage = e.target.getStage();
    stage.draggable(false);
    
    // Store initial position for multiple node dragging
    setDragStartPosition({ x: node.position.x, y: node.position.y });
    
    // If multiple nodes are selected, store their initial positions
    if (selectedNodeIds.size > 1 && node.isSelected) {
      const nodes = useMindmapStore.getState().nodes;
      const initialPositions = new Map<string, {x: number, y: number}>();
      
      selectedNodeIds.forEach(id => {
        if (id !== node.id) {
          const otherNode = nodes.find(n => n.id === id);
          if (otherNode) {
            initialPositions.set(id, { x: otherNode.position.x, y: otherNode.position.y });
          }
        }
      });
      
      setOtherNodesStartPositions(initialPositions);
    }
  };

  const handleDragMove = (e: any) => {
    // If multiple nodes are selected
    if (selectedNodeIds.size > 1 && node.isSelected && dragStartPosition && otherNodesStartPositions.size > 0) {
      const position = e.target.position();
      const deltaX = position.x - dragStartPosition.x;
      const deltaY = position.y - dragStartPosition.y;
      
      // Update all selected nodes' positions based on their initial positions
      otherNodesStartPositions.forEach((startPos, id) => {
        updateNode(id, {
          position: {
            x: startPos.x + deltaX,
            y: startPos.y + deltaY,
          }
        }, false); // false = don't save to history yet
      });
    }
  };

  const handleDragEnd = (e: any) => {
    const stage = e.target.getStage();
    stage.draggable(false);
    
    const position = e.target.position();
    
    // If multiple nodes were dragged
    if (selectedNodeIds.size > 1 && node.isSelected && dragStartPosition && otherNodesStartPositions.size > 0) {
      const deltaX = position.x - dragStartPosition.x;
      const deltaY = position.y - dragStartPosition.y;
      
      // Final update for all nodes
      const updates: Array<{id: string, position: {x: number, y: number}}> = [];
      
      updates.push({
        id: node.id,
        position: { x: position.x, y: position.y }
      });
      
      otherNodesStartPositions.forEach((startPos, id) => {
        updates.push({
          id,
          position: {
            x: startPos.x + deltaX,
            y: startPos.y + deltaY,
          }
        });
      });
      
      // Update all nodes and save to history
      updates.forEach(({ id, position }) => {
        updateNode(id, { position }, id === node.id);
      });
      
      // Save history once for the entire operation
      useMindmapStore.getState().saveSnapshot();
    } else {
      // Single node update
      updateNode(node.id, {
        position: {
          x: position.x,
          y: position.y,
        },
      }, true);
    }
    
    // Clear drag start positions
    setDragStartPosition(null);
    setOtherNodesStartPositions(new Map());
  };

  // Visual style based on state
  const fillColor = node.isEditing ? '#007bff' : (node.isSelected ? '#17a2b8' : '#ffffff');
  const strokeColor = node.isEditing ? '#0056b3' : (node.isSelected ? '#138496' : '#dee2e6');
  const strokeWidth = (node.isEditing || node.isSelected) ? 2 : 1;
  const textColor = node.isEditing ? '#ffffff' : (node.isSelected ? '#ffffff' : '#212529');

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable={!node.isEditing && isDragAllowed}
      onClick={handleClick}
      onTap={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      listening={true}
    >
      {/* Node background */}
      <Rect
        width={node.size.width}
        height={node.size.height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        cornerRadius={8}
        shadowBlur={node.isEditing ? 12 : (node.isSelected ? 8 : 5)}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowOffsetY={2}
      />
      
      {/* Node text */}
      <Text
        text={node.text}
        x={8}
        y={8}
        width={node.size.width - 16}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fill={textColor}
        align="center"
        lineHeight={1.4}
        wrap="word"
        verticalAlign="middle"
      />
      
      {/* Connection points - hide when editing */}
      {!node.isEditing && connectionPoints.map(point => {
        const store = useMindmapStore.getState();
        
        // Hide if this node is part of the edited connection
        if (canvasState.isEditingConnection && canvasState.editingConnectionId) {
          const editingConnection = store.connections.find(c => c.id === canvasState.editingConnectionId);
          if (editingConnection && (editingConnection.from === node.id || editingConnection.to === node.id)) {
            return null;
          }
        }
        
        // Hide if any connection involving this node is selected
        if (store.selectedConnectionId) {
          const selectedConnection = store.connections.find(c => c.id === store.selectedConnectionId);
          if (selectedConnection && (selectedConnection.from === node.id || selectedConnection.to === node.id)) {
            return null;
          }
        }
        
        // Hide during active connection
        if (canvasState.isConnecting && canvasState.connectionStartPoint?.includes(node.id)) {
          return null;
        }
        
        return (
          <ConnectionPointComponent
            key={point.id}
            connectionPoint={point}
            nodeSize={node.size}
            isHovered={canvasState.hoveredConnectionPoint === point.id}
            isActive={canvasState.activeConnectionPoint === point.id}
            onMouseEnter={() => handleConnectionPointMouseEnter(point.id)}
            onMouseLeave={handleConnectionPointMouseLeave}
            onMouseDown={(e: any) => handleConnectionPointMouseDown(point.id, e)}
            onMouseUp={(e: any) => handleConnectionPointMouseUp(point.id, e)}
          />
        );
      })}
    </Group>
  );
};