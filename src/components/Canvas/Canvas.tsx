import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Text, Group, Circle } from 'react-konva';
import { useMindmapStore, useCanvasState, useNodes, useConnections } from '../../stores/mindmapStore';
import { NodeComponent } from '../Node/NodeComponent';
import { ConnectionLine } from '../Connection/ConnectionLine';
import { ConnectionLabelEditor } from '../Connection/ConnectionLabelEditor';
import { DashedArrow } from '../Connection/DashedArrow';
import type { Position } from '../../types';

interface CanvasProps {
  width: number;
  height: number;
  onCanvasClick: (position: Position) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height, onCanvasClick }) => {
  const stageRef = useRef<any>(null);
  const canvasState = useCanvasState();
  const nodes = useNodes();
  const connections = useConnections();
  const { setCanvasOffset, setCanvasZoom, setCanvasDragging, selectNode, selectConnection, deleteConnection, deleteNode, updateConnectionPreview, endConnection, stopAllEditing, saveAndStopAllEditing, startEditingConnectionLabel, updateConnection, stopEditingConnectionLabel, cancelConnectionEndpointEdit, startEditingConnectionEndpoint, updateConnectionEndpoint, undo, redo, addNode } = useMindmapStore();

  // Track last click time for double-click detection
  const lastClickTimeRef = useRef<number>(0);
  const lastClickConnectionRef = useRef<string | null>(null);

  // Handle canvas click (clear selections or add node)
  const handleStageClick = (e: any) => {
    console.log('Stage click - target:', e.target.getType?.(), 'name:', e.target.name?.());
    
    // Check if click is on a connection handle first
    const targetName = e.target.name?.();
    const targetType = e.target.getType?.();
    console.log('🔍 Target analysis - name:', targetName, 'type:', targetType);
    
    if (targetName && (targetName.includes('handle') || targetName === 'start-handle' || targetName === 'end-handle' || targetName === 'start-handle-hitarea' || targetName === 'end-handle-hitarea')) {
      console.log('🔗 Click detected on connection handle:', targetName, 'letting handle process it');
      // Handle clicks are processed by their own event handlers
      // Don't process this click further to avoid interference
      return;
    }
    
    // Also check if this is a Circle (handle) by checking for nearby handle positions
    if (targetType === 'Circle') {
      console.log('🔗 Circle detected, could be a handle - checking coordinates');
      // Let handle events process this instead of stage events
      return;
    }
    
    
    // If we're connecting, end the connection
    if (canvasState.isConnecting) {
      endConnection();
      return;
    }
    
    
    // Skip connection hit testing if click originated from a node
    // Nodes handle their own click events and shouldn't trigger connection editing
    const isNodeClick = targetType === 'Rect' || targetType === 'Text' || targetType === 'Group';
    
    if (isNodeClick) {
      console.log('Click originated from node, skipping connection hit testing');
      // Only add node if clicking on empty space (stage itself)
      if (e.target === e.target.getStage()) {
        // Clear all selections and auto-save editing when clicking on empty space
        selectNode(undefined);
        selectConnection(undefined);
        saveAndStopAllEditing();
        
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        if (pointer) {
          // Convert screen coordinates to canvas coordinates
          const canvasPosition = {
            x: (pointer.x - canvasState.offset.x) / canvasState.zoom,
            y: (pointer.y - canvasState.offset.y) / canvasState.zoom,
          };
          
          onCanvasClick(canvasPosition);
        }
      }
      return;
    }
    
    // Get click coordinates - reuse stage and pointer variables
    const clickStage = e.target.getStage();
    const clickPointer = clickStage.getPointerPosition();
    
    if (clickPointer) {
      // Convert screen coordinates to canvas coordinates
      const canvasPosition = {
        x: (clickPointer.x - canvasState.offset.x) / canvasState.zoom,
        y: (clickPointer.y - canvasState.offset.y) / canvasState.zoom,
      };
      
      console.log('Click position:', canvasPosition);
      
      // Check if we're in connection endpoint editing mode and this might be a node click
      if (canvasState.isEditingConnection && canvasState.editingConnectionId && canvasState.editingEndpoint) {
        console.log('🎯 In connection editing mode, checking for node click...');
        
        // Check if the click is on any node for endpoint editing
        const clickedNode = nodes.find(node => {
          const nodeLeft = node.position.x;
          const nodeTop = node.position.y;
          const nodeRight = node.position.x + node.size.width;
          const nodeBottom = node.position.y + node.size.height;
          
          console.log(`🔍 Checking node ${node.text}: bounds (${nodeLeft}, ${nodeTop}) to (${nodeRight}, ${nodeBottom}), click at (${canvasPosition.x}, ${canvasPosition.y})`);
          
          // Add tolerance for click detection (25 pixels to account for coordinate precision)
          const tolerance = 25;
          const isWithin = canvasPosition.x >= (nodeLeft - tolerance) && 
                          canvasPosition.x <= (nodeRight + tolerance) && 
                          canvasPosition.y >= (nodeTop - tolerance) && 
                          canvasPosition.y <= (nodeBottom + tolerance);
          
          if (isWithin) {
            console.log(`✅ Click is within ${node.text} bounds!`);
          }
          
          return isWithin;
        });
        
        if (clickedNode) {
          console.log('🎯 Node clicked during connection editing - updating endpoint to:', clickedNode.id);
          console.log('🎯 Current editing state:', {
            connectionId: canvasState.editingConnectionId,
            endpoint: canvasState.editingEndpoint
          });
          
          // Update the connection endpoint to this node
          updateConnectionEndpoint(canvasState.editingConnectionId, clickedNode.id);
          
          console.log('✅ Connection endpoint updated');
          return;
        }
      }
      
      // Check if this click is on a connection handle first 
      // We need to check all connections, not just selected ones, because selection might change during click processing
      console.log('🔍 Available connections:', connections.map(c => ({ id: c.id, isSelected: c.isSelected })));
      
      for (const connection of connections) {
        if (!connection.isSelected) {
          console.log('🔍 Skipping unselected connection:', connection.id);
          continue;
        }
        
        console.log('🎯 Checking handle hit testing for selected connection:', connection.id);
        
        const fromNode = nodes.find(n => n.id === connection.from);
        const toNode = nodes.find(n => n.id === connection.to);
        
        console.log('🔍 Found nodes - from:', !!fromNode, 'to:', !!toNode);
        
        if (fromNode && toNode) {
          console.log('🔍 Both nodes found, calculating handle positions...');
          // Calculate handle positions (same as in ConnectionLine.tsx)
          const fromCenter = {
            x: fromNode.position.x + fromNode.size.width / 2,
            y: fromNode.position.y + fromNode.size.height / 2,
          };
          const toCenter = {
            x: toNode.position.x + toNode.size.width / 2,
            y: toNode.position.y + toNode.size.height / 2,
          };
          
          // Calculate edge points for handles (using same logic as ConnectionLine.tsx)
          const dx = toCenter.x - fromCenter.x;
          const dy = toCenter.y - fromCenter.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const unitX = dx / distance;
            const unitY = dy / distance;
            
            // Calculate edge offset (half node size)
            const fromEdgeOffset = {
              x: unitX * (fromNode.size.width / 2),
              y: unitY * (fromNode.size.height / 2),
            };
            
            const toEdgeOffset = {
              x: unitX * (toNode.size.width / 2),
              y: unitY * (toNode.size.height / 2),
            };
            
            const startPoint = {
              x: fromCenter.x + fromEdgeOffset.x,
              y: fromCenter.y + fromEdgeOffset.y,
            };
            
            const endPoint = {
              x: toCenter.x - toEdgeOffset.x,
              y: toCenter.y - toEdgeOffset.y,
            };
            
            // Check if click is within handle radius (30px for good UX)
            const startDistance = Math.sqrt(
              Math.pow(canvasPosition.x - startPoint.x, 2) + 
              Math.pow(canvasPosition.y - startPoint.y, 2)
            );
            
            const endDistance = Math.sqrt(
              Math.pow(canvasPosition.x - endPoint.x, 2) + 
              Math.pow(canvasPosition.y - endPoint.y, 2)
            );
            
            console.log('🎯 Handle distances calculated - start:', startDistance.toFixed(1), 'end:', endDistance.toFixed(1));
            console.log('🎯 Handle positions - start:', startPoint, 'end:', endPoint);
            console.log('🎯 Click position:', canvasPosition);
            
            if (startDistance <= 55) {
              console.log('🟢 START HANDLE HIT! Starting endpoint editing for start');
              startEditingConnectionEndpoint(connection.id, 'start');
              return;
            }
            
            if (endDistance <= 55) {
              console.log('🔴 END HANDLE HIT! Starting endpoint editing for end');
              startEditingConnectionEndpoint(connection.id, 'end');
              return;
            }
            
            console.log('🔍 No handle hits detected, continuing to connection hit testing...');
          }
        }
      }
      
      // Manual hit testing for connections since Konva events aren't working properly
      const clickedConnection = connections.find(connection => {
        const fromNode = nodes.find(n => n.id === connection.from);
        const toNode = nodes.find(n => n.id === connection.to);
        
        if (!fromNode || !toNode) return false;
        
        // Calculate connection bounding box (same as debug rectangle)
        const fromCenter = {
          x: fromNode.position.x + fromNode.size.width / 2,
          y: fromNode.position.y + fromNode.size.height / 2,
        };
        const toCenter = {
          x: toNode.position.x + toNode.size.width / 2,
          y: toNode.position.y + toNode.size.height / 2,
        };
        
        const minX = Math.min(fromCenter.x, toCenter.x) - 30;
        const minY = Math.min(fromCenter.y, toCenter.y) - 30;
        const maxX = Math.max(fromCenter.x, toCenter.x) + 30;
        const maxY = Math.max(fromCenter.y, toCenter.y) + 30;
        
        console.log(`Connection ${connection.id} bounds:`, 
          `minX=${minX.toFixed(0)}, maxX=${maxX.toFixed(0)}, minY=${minY.toFixed(0)}, maxY=${maxY.toFixed(0)}`,
          `click=(${canvasPosition.x.toFixed(0)}, ${canvasPosition.y.toFixed(0)})`
        );
        
        // Check if click is within connection bounding box
        const isWithin = canvasPosition.x >= minX && 
               canvasPosition.x <= maxX && 
               canvasPosition.y >= minY && 
               canvasPosition.y <= maxY;
        
        if (isWithin) {
          console.log('Click is within connection bounds!');
        }
        
        return isWithin;
      });
      
      if (clickedConnection) {
        console.log('Manual hit test: clicked on connection', clickedConnection.id);
        
        // Double-click detection
        const currentTime = Date.now();
        const timeDiff = currentTime - lastClickTimeRef.current;
        const isDoubleClick = timeDiff < 500 && lastClickConnectionRef.current === clickedConnection.id;
        
        lastClickTimeRef.current = currentTime;
        lastClickConnectionRef.current = clickedConnection.id;
        
        if (isDoubleClick) {
          console.log('Double-click detected on connection:', clickedConnection.id);
          // Trigger label editing
          selectConnection(clickedConnection.id);
          startEditingConnectionLabel(clickedConnection.id);
        } else {
          selectConnection(clickedConnection.id);
        }
        return;
      }
    }
    
    // Only add node if clicking on empty space (stage itself)
    if (e.target === e.target.getStage()) {
      // Clear all selections and auto-save editing when clicking on empty space
      selectNode(undefined);
      selectConnection(undefined);
      saveAndStopAllEditing();
      
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      if (pointer) {
        // Convert screen coordinates to canvas coordinates
        const canvasPosition = {
          x: (pointer.x - canvasState.offset.x) / canvasState.zoom,
          y: (pointer.y - canvasState.offset.y) / canvasState.zoom,
        };
        
        onCanvasClick(canvasPosition);
      }
    }
  };

  // Handle mouse move for connection preview
  const handleStageMouseMove = (e: any) => {
    if (canvasState.isConnecting) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      
      if (pointer) {
        // Convert screen coordinates to canvas coordinates
        const canvasPosition = {
          x: (pointer.x - canvasState.offset.x) / canvasState.zoom,
          y: (pointer.y - canvasState.offset.y) / canvasState.zoom,
        };
        
        updateConnectionPreview(canvasPosition);
      }
    }
  };

  // Handle wheel scroll (changed from zoom to scroll)
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const scrollSpeed = 0.5; // Even slower scroll speed for precise control
    
    // Support both Shift+wheel for horizontal and native trackpad horizontal scroll
    let deltaX = 0;
    let deltaY = 0;
    
    if (e.evt.shiftKey) {
      // Shift + wheel = horizontal scroll
      deltaX = e.evt.deltaY;
      deltaY = 0;
    } else {
      // Normal wheel = vertical scroll, also check for deltaX for trackpad
      deltaX = e.evt.deltaX || 0; // Trackpad horizontal scroll
      deltaY = e.evt.deltaY || 0; // Vertical scroll
    }
    
    // Calculate new offset for scrolling
    const newOffset = {
      x: canvasState.offset.x - deltaX * scrollSpeed,
      y: canvasState.offset.y - deltaY * scrollSpeed,
    };
    
    setCanvasOffset(newOffset);
  };

  // Handle stage drag (pan) - only when not dragging nodes
  const handleStageMouseDown = (e: any) => {
    // Only allow stage drag if clicking on stage itself (not on nodes)
    if (e.target === e.target.getStage()) {
      e.target.getStage().draggable(true);
    }
  };

  const handleStageMouseUp = (e: any) => {
    // Always disable dragging after mouse up
    e.target.getStage().draggable(false);
  };

  const handleStageDragStart = (e: any) => {
    if (e.target === e.target.getStage()) {
      setCanvasDragging(true);
    }
  };

  const handleStageDragEnd = (e: any) => {
    setCanvasDragging(false);
    
    if (e.target === e.target.getStage()) {
      setCanvasOffset({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
    
    // Always disable dragging after drag ends
    e.target.getStage().draggable(false);
  };

  // Multi-key shortcut state
  const keySequenceRef = useRef<string[]>([]);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Keyboard shortcuts with multi-key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any node is being edited - if so, don't handle global shortcuts
      const isAnyNodeEditing = nodes.some(node => node.isEditing);
      if (isAnyNodeEditing) {
        return; // Allow node editing to handle its own keyboard events
      }

      // Only handle shortcuts when canvas is focused
      if (e.target === document.body) {
        const isCommandKey = e.ctrlKey || e.metaKey;
        
        // Handle multi-key sequences
        if (isCommandKey) {
          // Clear existing timeout
          if (sequenceTimeoutRef.current) {
            clearTimeout(sequenceTimeoutRef.current);
          }
          
          // Add key to sequence
          keySequenceRef.current.push(e.key.toLowerCase());
          
          // Set timeout to reset sequence after 1.5 seconds
          sequenceTimeoutRef.current = setTimeout(() => {
            keySequenceRef.current = [];
          }, 1500);
          
          const currentSequence = keySequenceRef.current.join('');
          
          // Check for multi-key shortcuts
          if (currentSequence === 'an') {
            // Command+A+N: Add Node
            e.preventDefault();
            const centerPosition = { x: 300, y: 200 };
            addNode(centerPosition, 'New Node');
            keySequenceRef.current = [];
            return;
          } else if (currentSequence === 'dn') {
            // Command+D+N: Delete Node
            e.preventDefault();
            const selectedNode = nodes.find(node => node.isSelected);
            if (selectedNode) {
              deleteNode(selectedNode.id);
            }
            keySequenceRef.current = [];
            return;
          }
        } else {
          // Reset sequence for non-command keys
          keySequenceRef.current = [];
        }

        // Handle single-key shortcuts
        if (e.key === '0' && isCommandKey) {
          e.preventDefault();
          // Reset zoom and center
          setCanvasZoom(1);
          setCanvasOffset({ x: 0, y: 0 });
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          
          // Check for selected node first
          const selectedNode = nodes.find(node => node.isSelected);
          if (selectedNode) {
            // Delete selected node (this will also delete connected lines via store logic)
            deleteNode(selectedNode.id);
            return;
          }
          
          // If no node selected, check for selected connection
          const selectedConnection = connections.find(conn => conn.isSelected);
          if (selectedConnection) {
            deleteConnection(selectedConnection.id);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          // Cancel connection editing if active
          if (canvasState.isEditingConnection) {
            cancelConnectionEndpointEdit();
          } else {
            // Clear all selections
            selectNode(undefined);
            selectConnection(undefined);
          }
        } else if (e.key === 'z' && isCommandKey && !e.shiftKey) {
          e.preventDefault();
          // Command+Z: Undo
          undo();
        } else if ((e.key === 'y' && isCommandKey) || (e.key === 'z' && isCommandKey && e.shiftKey)) {
          e.preventDefault();
          // Command+Y or Command+Shift+Z: Redo
          redo();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Reset sequence when command key is released
      if (!e.ctrlKey && !e.metaKey) {
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
        }
        keySequenceRef.current = [];
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [setCanvasZoom, setCanvasOffset, nodes, connections, deleteNode, deleteConnection, selectNode, selectConnection, undo, redo, canvasState.isEditingConnection, cancelConnectionEndpointEdit, addNode]);

  return (
    <div className="canvas-container" style={{ width, height, overflow: 'hidden' }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={canvasState.offset.x}
        y={canvasState.offset.y}
        scaleX={canvasState.zoom}
        scaleY={canvasState.zoom}
        draggable={false}  // Initially not draggable, controlled by drag handlers
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onMouseMove={handleStageMouseMove}
        onWheel={handleWheel}
        onDragStart={handleStageDragStart}
        onDragEnd={handleStageDragEnd}
      >
        <Layer>
          {/* Show hint when no nodes exist */}
          {nodes.length === 0 && (
            <Text
              text="「Add Node」ボタンを押してアイデアを追加しましょう"
              x={width / 2 / canvasState.zoom - 150}
              y={height / 2 / canvasState.zoom - 20}
              width={300}
              fontSize={16}
              fontFamily="Arial, sans-serif"
              fill="#6c757d"
              align="center"
              opacity={0.7}
            />
          )}
          
          {/* Render connections (behind nodes) */}
          {connections.map(connection => (
            <ConnectionLine key={connection.id} connection={connection} />
          ))}
          
          {/* Render connection preview (dashed arrow) */}
          {canvasState.isConnecting && 
           canvasState.connectionStartPosition && 
           canvasState.connectionEndPosition && (
            <DashedArrow
              startPoint={canvasState.connectionStartPosition}
              endPoint={canvasState.connectionEndPosition}
            />
          )}
          
          {/* Render nodes (in front of connections) */}
          {nodes.map(node => (
            <NodeComponent key={node.id} node={node} />
          ))}
          
          {/* Connection handles are now rendered in ConnectionLine.tsx */}
        </Layer>

        {/* Label editor layer - in front of everything */}
        <Layer>
          {connections.map(connection => {
            if (!connection.isEditingLabel) return null;
            
            // Calculate label position
            const fromNode = nodes.find(n => n.id === connection.from);
            const toNode = nodes.find(n => n.id === connection.to);
            
            if (!fromNode || !toNode) return null;
            
            const labelPosition = {
              x: (fromNode.position.x + fromNode.size.width / 2 + toNode.position.x + toNode.size.width / 2) / 2,
              y: (fromNode.position.y + fromNode.size.height / 2 + toNode.position.y + toNode.size.height / 2) / 2 - 25,
            };

            const handleLabelSave = (label: string) => {
              updateConnection(connection.id, { label });
              stopEditingConnectionLabel(connection.id);
            };

            const handleLabelCancel = () => {
              stopEditingConnectionLabel(connection.id);
            };
            
            return (
              <ConnectionLabelEditor
                key={`editor-${connection.id}`}
                position={labelPosition}
                currentLabel={connection.label}
                onSave={handleLabelSave}
                onCancel={handleLabelCancel}
              />
            );
          })}
        </Layer>
      </Stage>
      
      {/* Canvas info overlay (development helper) */}
      <div className="canvas-info">
        <small>
          Zoom: {(canvasState.zoom * 100).toFixed(0)}% | 
          Offset: ({canvasState.offset.x.toFixed(0)}, {canvasState.offset.y.toFixed(0)})
        </small>
      </div>
    </div>
  );
};