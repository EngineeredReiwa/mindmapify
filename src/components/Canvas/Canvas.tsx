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
  const { setCanvasOffset, setCanvasZoom, setCanvasDragging, selectNode, selectConnection, selectAll, clearSelection, deleteConnection, deleteNode, updateConnectionPreview, endConnection, stopAllEditing, saveAndStopAllEditing, startEditingConnectionLabel, updateConnection, stopEditingConnectionLabel, cancelConnectionEndpointEdit, startEditingConnectionEndpoint, updateConnectionEndpoint, undo, redo, addNode } = useMindmapStore();

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
      
      // Simplified connection hit testing - let ConnectionLine components handle their own events
      // Only perform fallback manual hit testing if needed
      const clickedConnection = connections.find(connection => {
        const fromNode = nodes.find(n => n.id === connection.from);
        const toNode = nodes.find(n => n.id === connection.to);
        
        if (!fromNode || !toNode) return false;
        
        // Use more precise line distance calculation instead of bounding box
        const fromCenter = {
          x: fromNode.position.x + fromNode.size.width / 2,
          y: fromNode.position.y + fromNode.size.height / 2,
        };
        const toCenter = {
          x: toNode.position.x + toNode.size.width / 2,
          y: toNode.position.y + toNode.size.height / 2,
        };
        
        // Calculate distance from click point to line
        const lineLength = Math.sqrt(
          Math.pow(toCenter.x - fromCenter.x, 2) + 
          Math.pow(toCenter.y - fromCenter.y, 2)
        );
        
        if (lineLength === 0) return false;
        
        // Calculate the closest point on the line to the click
        const t = Math.max(0, Math.min(1, 
          ((canvasPosition.x - fromCenter.x) * (toCenter.x - fromCenter.x) + 
           (canvasPosition.y - fromCenter.y) * (toCenter.y - fromCenter.y)) / (lineLength * lineLength)
        ));
        
        const closestPoint = {
          x: fromCenter.x + t * (toCenter.x - fromCenter.x),
          y: fromCenter.y + t * (toCenter.y - fromCenter.y)
        };
        
        // Calculate distance from click to closest point on line
        const distance = Math.sqrt(
          Math.pow(canvasPosition.x - closestPoint.x, 2) + 
          Math.pow(canvasPosition.y - closestPoint.y, 2)
        );
        
        const hitThreshold = 40; // Increased tolerance for better UX
        
        // Distance calculation complete
        
        return distance <= hitThreshold;
      });
      
      if (clickedConnection) {
        // Double-click detection with improved timing
        const currentTime = Date.now();
        const timeDiff = currentTime - lastClickTimeRef.current;
        const isDoubleClick = timeDiff < 400 && lastClickConnectionRef.current === clickedConnection.id;
        
        lastClickTimeRef.current = currentTime;
        lastClickConnectionRef.current = clickedConnection.id;
        
        if (isDoubleClick) {
          // Only trigger label editing if not in endpoint editing mode
          if (!canvasState.isEditingConnection) {
            selectConnection(clickedConnection.id);
            startEditingConnectionLabel(clickedConnection.id);
          }
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
  
  // Key repeat state for zoom
  const keyRepeatRef = useRef<{key: string, timeout: NodeJS.Timeout | null}>({key: '', timeout: null});


  // Keyboard shortcuts with multi-key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any node is being edited - if so, only allow deletion shortcuts
      const isAnyNodeEditing = nodes.some(node => node.isEditing);
      const isCommandKey = e.ctrlKey || e.metaKey;
      
      if (isAnyNodeEditing) {
        // During editing, only allow deletion shortcuts
        if (e.key === 'd' && e.shiftKey && isCommandKey) {
          e.preventDefault();
          e.stopPropagation();
          
          // Delete the currently editing node
          const editingNode = nodes.find(node => node.isEditing);
          if (editingNode) {
            deleteNode(editingNode.id);
          }
          return;
        }
        // Allow node editing to handle other keyboard events
        return;
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
          
          // Check for single key + modifier shortcuts
          if (e.key === 'a' && e.shiftKey) {
            // Command+Shift+A: Add Node
            e.preventDefault();
            
            // Calculate visible bounds (same logic as toolbar)
            const zoom = canvasState.zoom;
            const offset = canvasState.offset;
            const margin = 100;
            
            const visibleBounds = {
              left: (-offset.x / zoom) + margin,
              top: (-offset.y / zoom) + margin,
              right: (-offset.x + window.innerWidth) / zoom - margin,
              bottom: (-offset.y + window.innerHeight) / zoom - margin,
            };
            
            // Find available position
            const nodeSize = { width: 120, height: 60 };
            const gridSpacing = 40;
            const positions: Array<{x: number, y: number, overlap: number}> = [];
            
            for (let row = 0; row < 5; row++) {
              for (let col = 0; col < 5; col++) {
                const x = visibleBounds.left + col * (nodeSize.width + gridSpacing);
                const y = visibleBounds.top + row * (nodeSize.height + gridSpacing);
                
                if (x + nodeSize.width <= visibleBounds.right && 
                    y + nodeSize.height <= visibleBounds.bottom) {
                  const overlapScore = nodes.reduce((score, node) => {
                    const dx = Math.abs(node.position.x - x);
                    const dy = Math.abs(node.position.y - y);
                    if (dx < nodeSize.width && dy < nodeSize.height) {
                      return score + 1;
                    }
                    return score;
                  }, 0);
                  
                  positions.push({ x, y, overlap: overlapScore });
                }
              }
            }
            
            positions.sort((a, b) => a.overlap - b.overlap);
            const selectedPos = positions[0] || { x: visibleBounds.left, y: visibleBounds.top };
            
            addNode({ x: selectedPos.x, y: selectedPos.y }, 'New Node');
            keySequenceRef.current = [];
            return;
          } else if (e.key === 'd' && e.shiftKey) {
            // Command+Shift+D: Delete selected items (safe deletion)
            e.preventDefault();
            
            const selectedNodes = nodes.filter(node => node.isSelected);
            const selectedConnections = connections.filter(conn => conn.isSelected);
            
            if (selectedNodes.length > 0 || selectedConnections.length > 0) {
              // Delete selected items
              selectedNodes.forEach(node => deleteNode(node.id));
              selectedConnections.forEach(conn => deleteConnection(conn.id));
            }
            // If nothing is selected, do nothing (safety feature)
            
            keySequenceRef.current = [];
            return;
          } else if (e.key === 'a' && !e.shiftKey) {
            // Command+A: Select All
            e.preventDefault();
            
            // Select all nodes and connections
            selectAll();
            
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
        } else if (e.key === '=' && isCommandKey) {
          e.preventDefault();
          // Command+Plus: Zoom In (repeatable)
          if (!e.repeat || keyRepeatRef.current.key !== 'zoomIn') {
            // Clear any existing repeat timeout
            if (keyRepeatRef.current.timeout) {
              clearTimeout(keyRepeatRef.current.timeout);
            }
            keyRepeatRef.current.key = 'zoomIn';
          }
          
          const currentZoom = useMindmapStore.getState().canvas.zoom;
          const newZoom = Math.min(currentZoom * 1.15, 5); // Slightly smaller step for smoother zoom
          setCanvasZoom(newZoom);
          
          // Set up repeat timeout for continuous zoom
          keyRepeatRef.current.timeout = setTimeout(() => {
            keyRepeatRef.current.key = '';
          }, 100);
          
        } else if (e.key === '-' && isCommandKey) {
          e.preventDefault();
          // Command+Minus: Zoom Out (repeatable)
          if (!e.repeat || keyRepeatRef.current.key !== 'zoomOut') {
            // Clear any existing repeat timeout
            if (keyRepeatRef.current.timeout) {
              clearTimeout(keyRepeatRef.current.timeout);
            }
            keyRepeatRef.current.key = 'zoomOut';
          }
          
          const currentZoom = useMindmapStore.getState().canvas.zoom;
          const newZoom = Math.max(currentZoom / 1.15, 0.1); // Slightly smaller step for smoother zoom
          setCanvasZoom(newZoom);
          
          // Set up repeat timeout for continuous zoom
          keyRepeatRef.current.timeout = setTimeout(() => {
            keyRepeatRef.current.key = '';
          }, 100);
        } else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
          e.preventDefault();
          // Show keyboard shortcuts help
          alert(
            'キーボードショートカット:\n\n' +
            '🎯 メイン操作:\n' +
            '• Cmd/Ctrl + Shift + A: 新規ノード追加 (Add Node)\n' +
            '• Cmd/Ctrl + Shift + D: 選択アイテム削除 (Delete)\n' +
            '• Cmd/Ctrl + A: 全選択 (Select All)\n\n' +
            '📝 編集操作:\n' +
            '• Cmd/Ctrl + Z: 元に戻す (Undo)\n' +
            '• Cmd/Ctrl + Y: やり直し (Redo)\n\n' +
            '🔍 表示操作:\n' +
            '• Cmd/Ctrl + Plus: ズームイン\n' +
            '• Cmd/Ctrl + Minus: ズームアウト\n' +
            '• Cmd/Ctrl + 0: ズームリセット\n\n' +
            '⌨️ その他:\n' +
            '• Delete/Backspace: 選択アイテム削除\n' +
            '• Escape: 選択解除/操作キャンセル\n' +
            '• ?: このヘルプを表示\n\n' +
            '💡 使い方: 全削除は Cmd+A → Cmd+Shift+D の2ステップで安全に！'
          );
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
      
      // Clear zoom repeat state when keys are released
      if (e.key === '=' || e.key === '-') {
        if (keyRepeatRef.current.timeout) {
          clearTimeout(keyRepeatRef.current.timeout);
        }
        keyRepeatRef.current.key = '';
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