import React, { useState, useRef, useEffect } from 'react';
import { Rect, Text, Group } from 'react-konva';
import { useMindmapStore } from '../../stores/mindmapStore';
// import { TextEditor } from './TextEditor';  // REMOVED - using direct Konva editing
import { ConnectionPointComponent } from './ConnectionPoint';
import type { Node, ConnectionPoint, Position } from '../../types';

interface NodeComponentProps {
  node: Node;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({ node }) => {
  const { updateNode, selectNode, startEditing, stopEditing, startConnection, endConnection } = useMindmapStore();
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<string | null>(null);
  const [activeConnectionPoint, setActiveConnectionPoint] = useState<string | null>(null);
  const [editingText, setEditingText] = useState(node.text);
  const [cursorPosition, setCursorPosition] = useState(node.text.length);
  const textRef = useRef<any>(null);
  const groupRef = useRef<any>(null);

  const handleClick = () => {
    // A案: 1クリックで必ず選択 + 編集開始
    console.log('Node clicked, isEditing:', node.isEditing);
    
    if (node.isEditing) {
      // 既に編集中の場合は何もしない（TextEditorがハンドル）
      console.log('Already editing, ignoring click');
      return;
    }
    
    console.log('Starting edit immediately');
    selectNode(node.id);
    setEditingText(node.text);
    startEditing(node.id);
    console.log('Edit mode started');
  };


  const handleTextSave = (newText: string) => {
    // Simple node size calculation
    const lineHeight = 20;
    const padding = 16;
    const maxWidth = 250;
    const minHeight = 60;
    
    const lines = newText.split('\n');
    const newHeight = Math.max(minHeight, lines.length * lineHeight + padding);
    
    updateNode(node.id, { 
      text: newText,
      size: {
        width: maxWidth,
        height: newHeight,
      }
    });
    stopEditing(node.id);
    selectNode(undefined); // Clear selection after save
  };

  const handleTextCancel = () => {
    setEditingText(node.text); // Reset to original text
    stopEditing(node.id);
  };

  const handleTextChange = (newText: string) => {
    setEditingText(newText); // Update display text in real-time
  };

  // 文字入力とカーソル移動を含むキーボードハンドリング
  useEffect(() => {
    if (!node.isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key, 'editing:', node.isEditing, 'cursor:', cursorPosition);
      
      const currentText = editingText;
      const pos = cursorPosition;

      // 制御キーの処理
      if (e.key === 'Escape') {
        e.preventDefault();
        handleTextCancel();
        return;
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleTextSave(editingText);
        return;
      }

      // 通常の編集操作
      e.preventDefault(); // ブラウザのデフォルト動作を防ぐ

      if (e.key === 'ArrowLeft') {
        // カーソル左移動
        setCursorPosition(Math.max(0, pos - 1));
      } else if (e.key === 'ArrowRight') {
        // カーソル右移動
        setCursorPosition(Math.min(currentText.length, pos + 1));
      } else if (e.key === 'ArrowUp') {
        // カーソル上移動（行間移動）
        const lines = currentText.split('\n');
        const textBeforeCursor = currentText.slice(0, pos);
        const currentLineIndex = textBeforeCursor.split('\n').length - 1;
        
        if (currentLineIndex > 0) {
          const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
          const currentCharIndex = pos - currentLineStart;
          
          const prevLineStart = currentText.lastIndexOf('\n', currentLineStart - 2) + 1;
          const prevLineEnd = currentLineStart - 1;
          const prevLineLength = prevLineEnd - prevLineStart;
          
          const newCharIndex = Math.min(currentCharIndex, prevLineLength);
          const newPos = prevLineStart + newCharIndex;
          setCursorPosition(newPos);
        }
      } else if (e.key === 'ArrowDown') {
        // カーソル下移動（行間移動）
        const lines = currentText.split('\n');
        const textBeforeCursor = currentText.slice(0, pos);
        const currentLineIndex = textBeforeCursor.split('\n').length - 1;
        
        if (currentLineIndex < lines.length - 1) {
          const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
          const currentCharIndex = pos - currentLineStart;
          
          const nextLineStart = currentText.indexOf('\n', pos) + 1;
          const nextLineEnd = currentText.indexOf('\n', nextLineStart);
          const nextLineLength = nextLineEnd === -1 ? currentText.length - nextLineStart : nextLineEnd - nextLineStart;
          
          const newCharIndex = Math.min(currentCharIndex, nextLineLength);
          const newPos = nextLineStart + newCharIndex;
          setCursorPosition(newPos);
        }
      } else if (e.key === 'Backspace') {
        // バックスペース
        if (pos > 0) {
          const newText = currentText.slice(0, pos - 1) + currentText.slice(pos);
          setEditingText(newText);
          setCursorPosition(pos - 1);
        }
      } else if (e.key === 'Delete') {
        // Delete
        if (pos < currentText.length) {
          const newText = currentText.slice(0, pos) + currentText.slice(pos + 1);
          setEditingText(newText);
        }
      } else if (e.key === 'Enter') {
        // 改行
        const newText = currentText.slice(0, pos) + '\n' + currentText.slice(pos);
        setEditingText(newText);
        setCursorPosition(pos + 1);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // 通常の文字入力
        const newText = currentText.slice(0, pos) + e.key + currentText.slice(pos);
        setEditingText(newText);
        setCursorPosition(pos + 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [node.isEditing, editingText, cursorPosition]);

  // 編集モード開始時の初期化
  useEffect(() => {
    if (node.isEditing) {
      setEditingText(node.text);
      setCursorPosition(node.text.length);
    }
  }, [node.isEditing, node.text]);

  // カーソル付きテキストを生成
  const getDisplayTextWithCursor = () => {
    const text = editingText;
    const pos = cursorPosition;
    // カーソル位置に '|' を挿入
    return text.slice(0, pos) + '|' + text.slice(pos);
  };


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
  };

  const handleConnectionPointMouseLeave = () => {
    setHoveredConnectionPoint(null);
  };

  const getAbsoluteConnectionPointPosition = (pointId: string): Position => {
    const connectionPoint = connectionPoints.find(p => p.id === pointId);
    if (!connectionPoint) return { x: 0, y: 0 };
    
    const { position } = connectionPoint;
    const { width, height } = node.size;
    
    let localPos = { x: 0, y: 0 };
    switch (position) {
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
    
    // Group already has x={node.position.x} y={node.position.y}, 
    // so we need to add them to get absolute position
    return {
      x: node.position.x + localPos.x,
      y: node.position.y + localPos.y,
    };
  };

  const handleConnectionPointMouseDown = (pointId: string, e: any) => {
    e.cancelBubble = true;
    setActiveConnectionPoint(pointId);
    
    const absolutePosition = getAbsoluteConnectionPointPosition(pointId);
    startConnection(pointId, absolutePosition);
  };

  const handleConnectionPointMouseUp = (pointId: string, e: any) => {
    e.cancelBubble = true;
    setActiveConnectionPoint(null);
    
    // If we're in connecting mode and this is a different connection point
    const canvasState = useMindmapStore.getState().canvas;
    
    if (canvasState.isConnecting && canvasState.connectionStartPoint !== pointId) {
      // This is a valid drop target
      endConnection(pointId);
    } else if (canvasState.isConnecting) {
      // Same connection point or invalid drop, cancel connection
      endConnection();
    }
  };

  const handleDragStart = (e: any) => {
    // Prevent stage from dragging when dragging nodes
    const stage = e.target.getStage();
    stage.draggable(false);
  };

  const handleDragEnd = (e: any) => {
    // Re-enable stage dragging
    const stage = e.target.getStage();
    stage.draggable(true);
    
    // Get the actual position
    const position = e.target.position();
    
    updateNode(node.id, {
      position: {
        x: position.x,
        y: position.y,
      },
    });
  };

  // Visual style based on state
  const fillColor = node.isSelected ? '#007bff' : '#ffffff';
  const strokeColor = node.isSelected ? '#0056b3' : '#dee2e6';
  const strokeWidth = node.isSelected ? 2 : 1;

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable={!node.isEditing} // Disable dragging while editing
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Node background */}
      <Rect
        width={node.size.width}
        height={node.size.height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        cornerRadius={8}
        shadowBlur={node.isSelected ? 10 : 5}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowOffsetY={2}
      />
      
      {/* Node text - with cursor when editing */}
      <Text
        text={node.isEditing ? getDisplayTextWithCursor() : node.text}
        x={8}
        y={8}
        width={node.size.width - 16}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fill={node.isSelected ? '#ffffff' : '#212529'}
        align="center"
        lineHeight={1.4}
      />
      
      {/* Direct Konva text editing - no overlay needed */}
      
      {/* Connection points - TEMPORARILY DISABLED */}
      {false && !node.isEditing && connectionPoints.map((point) => (
        <ConnectionPointComponent
          key={point.id}
          connectionPoint={{
            ...point,
            isHovered: hoveredConnectionPoint === point.id,
            isActive: activeConnectionPoint === point.id,
          }}
          nodeSize={node.size}
          onMouseEnter={() => handleConnectionPointMouseEnter(point.id)}
          onMouseLeave={() => handleConnectionPointMouseLeave()}
          onMouseDown={(e) => handleConnectionPointMouseDown(point.id, e)}
          onMouseUp={(e) => handleConnectionPointMouseUp(point.id, e)}
        />
      ))}
    </Group>
  );
};