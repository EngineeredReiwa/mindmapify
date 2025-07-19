import React from 'react';
import { useMindmapStore, useNodes } from '../../stores/mindmapStore';
import './Toolbar.css';

export const Toolbar: React.FC = () => {
  const nodes = useNodes();
  const { addNode, undo, redo, saveSnapshot } = useMindmapStore();

  const handleAddNode = () => {
    // Add node at center of canvas (layer coordinates, not stage coordinates)
    // This position is relative to the layer, not affected by zoom/pan
    const centerPosition = { x: 300, y: 200 };
    addNode(centerPosition, 'New Node');
  };

  const handleClear = () => {
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
          ➕ New Node
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
          onClick={handleClear}
          disabled={nodes.length === 0}
          title="Clear all nodes"
        >
          🗑️ Clear
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