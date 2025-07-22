import React from 'react';
import { createPortal } from 'react-dom';
import { useMindmapStore } from '../../stores/mindmapStore';
import { HTMLTextEditor } from '../Node/HTMLTextEditor';

export const HTMLEditingLayer: React.FC = () => {
  const nodes = useMindmapStore(state => state.nodes);
  const { updateNode, stopEditing, selectNode } = useMindmapStore();

  // Find nodes that are being edited
  const editingNodes = nodes.filter(node => node.isEditing);

  if (editingNodes.length === 0) {
    return null;
  }

  const handleSave = (nodeId: string, text: string) => {
    // Calculate node size based on text
    const lineHeight = 20;
    const padding = 16;
    const minWidth = 120;
    const maxWidth = 300;
    const minHeight = 60;
    const charWidth = 8;

    // Calculate size similar to NodeComponent
    const manualLines = text.split('\n');
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

    updateNode(nodeId, {
      text,
      size: {
        width: finalWidth,
        height: finalHeight,
      }
    });
    stopEditing(nodeId);
    selectNode(undefined);
  };

  const handleCancel = (nodeId: string) => {
    stopEditing(nodeId);
    selectNode(undefined);
  };

  // Create portal to render HTML overlay outside of Konva
  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {editingNodes.map(node => (
        <HTMLTextEditor
          key={node.id}
          node={node}
          onSave={(text) => handleSave(node.id, text)}
          onCancel={() => handleCancel(node.id)}
        />
      ))}
    </div>,
    document.body
  );
};