import React from 'react';
import { useMindmapStore, useNodes } from '../../stores/mindmapStore';
import './Toolbar.css';

export const Toolbar: React.FC = () => {
  const nodes = useNodes();
  const connections = useMindmapStore(state => state.connections);
  const { addNode, deleteNode, deleteConnection, undo, redo, saveSnapshot, zoomIn, zoomOut, resetZoom } = useMindmapStore();
  const selectedNodeId = useMindmapStore(state => state.selectedNodeId);
  const selectedConnection = connections.find(conn => conn.isSelected);

  const handleAddNode = () => {
    console.log('🎯 Add Node button clicked!');
    // Find a position within the visible area, preferring non-overlapping spots
    const findBestPosition = () => {
      // Get current canvas state for visible area calculation
      const canvasState = useMindmapStore.getState().canvas;
      const zoom = canvasState.zoom;
      const offset = canvasState.offset;
      
      // Calculate visible area (assuming typical screen size)
      const screenWidth = 1280;
      const screenHeight = 720;
      const margin = 100; // Keep nodes away from edges
      
      const visibleBounds = {
        left: (-offset.x / zoom) + margin,
        top: (-offset.y / zoom) + margin,
        right: (-offset.x + screenWidth) / zoom - margin,
        bottom: (-offset.y + screenHeight) / zoom - margin
      };
      
      console.log('Visible bounds:', visibleBounds);
      
      const nodeSize = { width: 120, height: 60 }; // Default node size
      const spacing = 30; // Minimum spacing between nodes
      
      // Generate candidate positions within visible area
      const candidates = [];
      const gridSize = 80; // Grid spacing for position candidates
      
      for (let x = visibleBounds.left; x < visibleBounds.right - nodeSize.width; x += gridSize) {
        for (let y = visibleBounds.top; y < visibleBounds.bottom - nodeSize.height; y += gridSize) {
          candidates.push({ x, y });
        }
      }
      
      // If no candidates (very zoomed in), use center of visible area
      if (candidates.length === 0) {
        return {
          x: (visibleBounds.left + visibleBounds.right) / 2,
          y: (visibleBounds.top + visibleBounds.bottom) / 2
        };
      }
      
      // Find the best candidate (least overlap)
      let bestPosition = candidates[0];
      let minOverlapScore = Infinity;
      
      for (const candidate of candidates) {
        let overlapScore = 0;
        
        // Calculate overlap score with existing nodes
        for (const node of nodes) {
          const dx = Math.abs(candidate.x - node.position.x);
          const dy = Math.abs(candidate.y - node.position.y);
          
          const overlapX = Math.max(0, (nodeSize.width + node.size.width) / 2 + spacing - dx);
          const overlapY = Math.max(0, (nodeSize.height + node.size.height) / 2 + spacing - dy);
          
          overlapScore += overlapX * overlapY; // Area of overlap
        }
        
        if (overlapScore < minOverlapScore) {
          minOverlapScore = overlapScore;
          bestPosition = candidate;
          
          // If we found a position with no overlap, use it
          if (overlapScore === 0) {
            break;
          }
        }
      }
      
      console.log('Selected position:', bestPosition, 'overlap score:', minOverlapScore);
      return bestPosition;
    };
    
    const position = findBestPosition();
    console.log('🎯 Adding node at position:', position);
    addNode(position, 'New Node');
    console.log('🎯 Add node called, current nodes:', useMindmapStore.getState().nodes.length);
  };

  const handleDeleteSelected = () => {
    // Delete selected node only
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  };

  const handleDeleteConnection = () => {
    // Delete selected connection only
    if (selectedConnection) {
      deleteConnection(selectedConnection.id);
    }
  };

  const handleClearAll = () => {
    // Save current state before clearing
    saveSnapshot();
    // Clear all nodes (this will also clear connections via store logic)
    const nodeIds = nodes.map(node => node.id);
    nodeIds.forEach(id => {
      useMindmapStore.getState().deleteNode(id);
    });
  };

  const canUndo = useMindmapStore(state => state.history.past.length > 0);
  const canRedo = useMindmapStore(state => state.history.future.length > 0);

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button 
          className="toolbar-btn primary"
          onClick={handleAddNode}
          title="Add new node (Cmd+Shift+A)"
        >
          ➕ Add Node
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button 
          className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          className="toolbar-btn danger"
          onClick={handleDeleteSelected}
          disabled={!selectedNodeId}
          title="Delete selected node (Cmd+Shift+D)"
        >
          🗑️ Delete Node
        </button>
        <button 
          className="toolbar-btn danger"
          onClick={handleDeleteConnection}
          disabled={!selectedConnection}
          title="Delete selected connection"
        >
          ➖ Delete Line
        </button>
        <button 
          className="toolbar-btn danger"
          onClick={handleClearAll}
          disabled={nodes.length === 0}
          title="Delete all nodes and connections (Cmd+A → Cmd+Shift+D)"
        >
          🗑️ Delete All
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          className="toolbar-btn"
          onClick={zoomIn}
          title="Zoom In (Cmd+Plus)"
        >
          🔍➕
        </button>
        <button 
          className="toolbar-btn"
          onClick={zoomOut}
          title="Zoom Out (Cmd+Minus)"
        >
          🔍➖
        </button>
        <button 
          className="toolbar-btn"
          onClick={resetZoom}
          title="Reset Zoom (Cmd+0)"
        >
          🎯
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          className="toolbar-btn"
          title="Help"
        >
          ？
        </button>
      </div>
    </div>
  );
};