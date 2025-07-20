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
    // Add node at center of canvas (layer coordinates, not stage coordinates)
    // This position is relative to the layer, not affected by zoom/pan
    const centerPosition = { x: 300, y: 200 };
    addNode(centerPosition, 'New Node');
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
          title="Add new node"
        >
          ➕ Add Node
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
        >
          ↶
        </button>
        <button 
          className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
          onClick={redo}
          disabled={!canRedo}
          title="Redo"
        >
          ↷
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          className="toolbar-btn danger"
          onClick={handleDeleteSelected}
          disabled={!selectedNodeId}
          title="Delete selected node"
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
          title="Delete all nodes and connections"
        >
          🗑️ Delete All
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          className="toolbar-btn"
          onClick={zoomIn}
          title="Zoom In"
        >
          🔍➕
        </button>
        <button 
          className="toolbar-btn"
          onClick={zoomOut}
          title="Zoom Out"
        >
          🔍➖
        </button>
        <button 
          className="toolbar-btn"
          onClick={resetZoom}
          title="Reset Zoom"
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