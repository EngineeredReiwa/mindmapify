import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Text } from 'react-konva';
import { useMindmapStore, useCanvasState, useNodes, useConnections } from '../../stores/mindmapStore';
import { NodeComponent } from '../Node/NodeComponent';
import { ConnectionLine } from '../Connection/ConnectionLine';
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
  const { setCanvasOffset, setCanvasZoom, setCanvasDragging, selectNode, selectConnection, deleteConnection, updateConnectionPreview, endConnection, stopAllEditing } = useMindmapStore();

  // Handle canvas click (clear selections or add node)
  const handleStageClick = (e: any) => {
    // If we're connecting, end the connection
    if (canvasState.isConnecting) {
      endConnection();
      return;
    }
    
    // Only add node if clicking on empty space (stage itself)
    if (e.target === e.target.getStage()) {
      // Clear all selections and stop editing when clicking on empty space
      selectNode(undefined);
      selectConnection(undefined);
      stopAllEditing();
      
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

  // Handle wheel zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    
    if (!pointer) return;
    
    const scaleBy = 1.1;
    const oldZoom = canvasState.zoom;
    const newZoom = e.evt.deltaY > 0 ? oldZoom / scaleBy : oldZoom * scaleBy;
    
    // Calculate new offset to zoom towards pointer
    const newOffset = {
      x: pointer.x - ((pointer.x - canvasState.offset.x) / oldZoom) * newZoom,
      y: pointer.y - ((pointer.y - canvasState.offset.y) / oldZoom) * newZoom,
    };
    
    setCanvasZoom(newZoom);
    setCanvasOffset(newOffset);
  };

  // Handle stage drag (pan) - only when not dragging nodes
  const handleStageDragStart = (e: any) => {
    // Only allow stage drag if clicking on stage itself (not on nodes)
    if (e.target === e.target.getStage()) {
      setCanvasDragging(true);
    } else {
      // Prevent stage dragging when clicking on nodes
      e.target.getStage().draggable(false);
    }
  };

  const handleStageDragEnd = (e: any) => {
    setCanvasDragging(false);
    // Re-enable stage dragging
    e.target.getStage().draggable(true);
    
    if (e.target === e.target.getStage()) {
      setCanvasOffset({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default browser shortcuts when canvas is focused
      if (e.target === document.body) {
        if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          // Reset zoom and center
          setCanvasZoom(1);
          setCanvasOffset({ x: 0, y: 0 });
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          // Delete selected connection
          const selectedConnection = connections.find(conn => conn.isSelected);
          if (selectedConnection) {
            deleteConnection(selectedConnection.id);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          // Clear all selections
          selectNode(undefined);
          selectConnection(undefined);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setCanvasZoom, setCanvasOffset, connections, deleteConnection, selectNode, selectConnection]);

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
        draggable={true}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseMove={handleStageMouseMove}
        onWheel={handleWheel}
        onDragStart={handleStageDragStart}
        onDragEnd={handleStageDragEnd}
      >
        <Layer>
          {/* Show hint when no nodes exist */}
          {nodes.length === 0 && (
            <Text
              text="「New Node」ボタンを押してアイデアを追加しましょう"
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
          
          {/* Render connections (behind nodes) - TEMPORARILY DISABLED */}
          {false && connections.map(connection => (
            <ConnectionLine key={connection.id} connection={connection} />
          ))}
          
          {/* Render connection preview (dashed arrow) - TEMPORARILY DISABLED */}
          {false && canvasState.isConnecting && 
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