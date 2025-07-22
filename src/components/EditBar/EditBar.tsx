import React, { useEffect, useRef } from 'react';
import { useMindmapStore } from '../../stores/mindmapStore';

export const EditBar: React.FC = () => {
  const nodes = useMindmapStore(state => state.nodes);
  const selectedNodeId = useMindmapStore(state => state.selectedNodeId);
  const { updateNode, stopEditing, selectNode } = useMindmapStore();
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Find the editing node
  const editingNode = nodes.find(node => node.isEditing);
  const [text, setText] = React.useState('');
  
  // Update text when editing node changes
  useEffect(() => {
    if (editingNode) {
      setText(editingNode.text);
      // Focus and select text if it's the default
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (editingNode.text === 'New Node') {
            inputRef.current.select();
          }
        }
      }, 10);
    } else {
      setText('');
    }
  }, [editingNode?.id, editingNode?.text]);
  
  const handleSave = () => {
    if (!editingNode) return;
    
    const trimmedText = text.trim() || 'New Node';
    
    // Calculate node size based on text
    const lineHeight = 20;
    const padding = 16;
    const minWidth = 120;
    const maxWidth = 300;
    const minHeight = 60;
    const charWidth = 8;

    const manualLines = trimmedText.split('\n');
    let totalDisplayLines = 0;
    let maxRequiredWidth = minWidth;

    for (const line of manualLines) {
      if (line.length === 0) {
        totalDisplayLines += 1;
        continue;
      }

      const lineRequiredWidth = line.length * charWidth + padding;
      maxRequiredWidth = Math.max(maxRequiredWidth, Math.min(maxWidth, lineRequiredWidth));

      const availableWidth = Math.min(maxWidth, Math.max(minWidth, lineRequiredWidth)) - padding;
      const charsPerLine = Math.floor(availableWidth / charWidth);
      const wrappedLines = Math.ceil(line.length / charsPerLine) || 1;

      totalDisplayLines += wrappedLines;
    }

    const finalWidth = Math.max(minWidth, Math.min(maxWidth, maxRequiredWidth));
    const finalHeight = Math.max(minHeight, totalDisplayLines * lineHeight + padding);

    updateNode(editingNode.id, {
      text: trimmedText,
      size: {
        width: finalWidth,
        height: finalHeight,
      }
    });
    stopEditing(editingNode.id);
    selectNode(undefined);
  };
  
  const handleCancel = () => {
    if (!editingNode) return;
    stopEditing(editingNode.id);
    selectNode(undefined);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };
  
  // Hide edit bar when not editing
  if (!editingNode) {
    return null;
  }
  
  return (
    <div className="edit-bar">
      <div className="edit-bar-content">
        <label className="edit-bar-label">
          編集中: Node {editingNode.id.slice(0, 8)}
        </label>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="edit-bar-input"
          placeholder="テキストを入力..."
        />
        <div className="edit-bar-actions">
          <button 
            onClick={handleSave}
            className="edit-bar-btn edit-bar-btn-save"
            title="保存 (Enter)"
          >
            ✓
          </button>
          <button 
            onClick={handleCancel}
            className="edit-bar-btn edit-bar-btn-cancel"
            title="キャンセル (Esc)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};