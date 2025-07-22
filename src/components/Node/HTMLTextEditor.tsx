import React, { useEffect, useRef, useState } from 'react';
import { useMindmapStore } from '../../stores/mindmapStore';
import type { Node } from '../../types';

interface HTMLTextEditorProps {
  node: Node;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export const HTMLTextEditor: React.FC<HTMLTextEditorProps> = ({ node, onSave, onCancel }) => {
  const [text, setText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas = useMindmapStore(state => state.canvas);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Select all text if it's the default
      if (node.text === 'New Node') {
        textareaRef.current.select();
      } else {
        // Place cursor at end
        textareaRef.current.setSelectionRange(text.length, text.length);
      }
    }
  }, []);

  // Update position based on canvas zoom and offset
  useEffect(() => {
    if (containerRef.current) {
      const x = (node.position.x + canvas.offset.x) * canvas.zoom;
      const y = (node.position.y + canvas.offset.y) * canvas.zoom;
      const width = node.size.width * canvas.zoom;
      const height = node.size.height * canvas.zoom;

      containerRef.current.style.transform = `translate(${x}px, ${y}px)`;
      containerRef.current.style.width = `${width}px`;
      containerRef.current.style.height = `${height}px`;
    }
  }, [node.position, node.size, canvas.offset, canvas.zoom]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      // Ctrl+A should work natively in textarea
      // Just prevent it from bubbling to canvas
      e.stopPropagation();
    }
  };

  const handleSave = () => {
    const trimmedText = text.trim();
    onSave(trimmedText || 'New Node');
  };

  const handleBlur = () => {
    // Small delay to handle click events on other elements
    setTimeout(() => {
      if (document.activeElement !== textareaRef.current) {
        handleSave();
      }
    }, 200);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'all',
        zIndex: 1000,
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          width: '100%',
          height: '100%',
          padding: '8px',
          border: '2px solid #007bff',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          color: '#212529',
          fontSize: '14px',
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.4',
          resize: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          textAlign: 'center',
          overflow: 'hidden',
        }}
        placeholder="Enter text..."
      />
    </div>
  );
};