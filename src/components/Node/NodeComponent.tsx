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
  const { updateNode, selectNode, startEditing, stopEditing, startConnection, endConnection, updateConnectionEndpoint, cancelConnectionEndpointEdit } = useMindmapStore();
  const canvasState = useMindmapStore(state => state.canvas);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<string | null>(null);
  const [activeConnectionPoint, setActiveConnectionPoint] = useState<string | null>(null);
  const [editingText, setEditingText] = useState(node.text);
  const [cursorPosition, setCursorPosition] = useState(node.text.length);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [selectedText, setSelectedText] = useState<{start: number, end: number} | null>(null);
  const textRef = useRef<any>(null);
  const groupRef = useRef<any>(null);

  const handleClick = (e: any) => {
    // Prevent event bubbling to canvas to avoid connection hit testing
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.preventDefault();
    }
    
    // Check if we're in connection endpoint editing mode
    if (canvasState.isEditingConnection && canvasState.editingConnectionId && canvasState.editingEndpoint) {
      console.log('🎯 Node clicked during connection editing - updating endpoint to:', node.id);
      
      // Update the connection endpoint to this node
      updateConnectionEndpoint(canvasState.editingConnectionId, node.id);
      
      // Exit connection editing mode
      cancelConnectionEndpointEdit();
      
      console.log('✅ Connection endpoint updated and editing mode exited');
      return;
    }
    
    // 1クリックで必ず選択 + 編集開始（元の仕様を維持）
    console.log('Node clicked, isEditing:', node.isEditing);
    
    if (node.isEditing) {
      // 既に編集中の場合は自動保存して編集終了
      console.log('Node clicked while editing - auto-saving');
      if (editingText !== node.text) {
        handleTextSave(editingText);
      } else {
        stopEditing(node.id);
      }
      return;
    }
    
    console.log('Starting edit immediately');
    selectNode(node.id);
    setEditingText(node.text);
    startEditing(node.id);
    console.log('Edit mode started');
  };


  const handleTextSave = (newText: string) => {
    // 最終的なノードサイズ計算（自動折り返し考慮）
    const lineHeight = 20;
    const padding = 16;
    const minWidth = 120;
    const maxWidth = 300;
    const minHeight = 60;
    const charWidth = 8;
    
    // 手動改行による行分割
    const manualLines = newText.split('\n');
    
    // 各手動改行行について、自動折り返しを考慮した実際の行数を計算
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
    
    updateNode(node.id, { 
      text: newText,
      size: {
        width: finalWidth,
        height: finalHeight,
      }
    }, true); // true = save to history
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

  // Auto-save when editing stops (outside click)
  useEffect(() => {
    // If editing was stopped but we have unsaved changes, auto-save them
    if (!node.isEditing && editingText !== node.text) {
      console.log('Auto-saving changes on edit end:', editingText);
      
      // Inline auto-save logic to avoid stale closure issues
      const lineHeight = 20;
      const padding = 16;
      const minWidth = 120;
      const maxWidth = 300;
      const minHeight = 60;
      const charWidth = 8;
      
      // 手動改行による行分割
      const manualLines = editingText.split('\n');
      
      // 各手動改行行について、自動折り返しを考慮した実際の行数を計算
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
      
      updateNode(node.id, { 
        text: editingText,
        size: {
          width: finalWidth,
          height: finalHeight,
        }
      });
      stopEditing(node.id);
      selectNode(undefined); // Clear selection after save
    }
  }, [node.isEditing, editingText, node.text, node.id, updateNode, stopEditing, selectNode]);

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
        e.stopPropagation();
        handleTextCancel();
        return;
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        handleTextSave(editingText);
        return;
      } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+V または Cmd+V でペースト
        console.log('Paste command detected!');
        e.preventDefault();
        e.stopPropagation();
        
        // クリップボードからテキストを取得してペースト
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(clipboardText => {
            console.log('Clipboard content:', clipboardText);
            if (clipboardText) {
              const currentText = editingText;
              const pos = cursorPosition;
              const newText = currentText.slice(0, pos) + clipboardText + currentText.slice(pos);
              console.log('Setting new text:', newText);
              setEditingText(newText);
              setCursorPosition(pos + clipboardText.length);
            }
          }).catch(err => {
            console.log('Modern clipboard read failed:', err);
            // フォールバックの処理をユーザーに案内
            alert('ペースト機能を使用するには、ブラウザでクリップボードアクセスを許可してください。\nまたは、右クリック → 貼り付けを使用してください。');
          });
        } else {
          console.log('Clipboard API not available');
          alert('このブラウザではクリップボードAPIが利用できません。\n右クリック → 貼り付けを使用してください。');
        }
        return;
      }

      // 通常の編集操作
      e.preventDefault(); // ブラウザのデフォルト動作を防ぐ
      e.stopPropagation(); // Canvasのキーボードハンドリングを防ぐ

      if (e.key === 'ArrowLeft') {
        // カーソル左移動
        setCursorPosition(Math.max(0, pos - 1));
        setSelectedText(null); // 選択解除
      } else if (e.key === 'ArrowRight') {
        // カーソル右移動
        setCursorPosition(Math.min(currentText.length, pos + 1));
        setSelectedText(null); // 選択解除
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
        setSelectedText(null); // 選択解除
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
        setSelectedText(null); // 選択解除
      } else if (e.key === 'Backspace') {
        // バックスペース - ノード削除は禁止、テキスト削除のみ
        if (selectedText) {
          // 選択範囲がある場合は削除
          const newText = currentText.slice(0, selectedText.start) + currentText.slice(selectedText.end);
          setEditingText(newText);
          setCursorPosition(selectedText.start);
          setSelectedText(null);
        } else if (pos > 0) {
          const newText = currentText.slice(0, pos - 1) + currentText.slice(pos);
          setEditingText(newText);
          setCursorPosition(pos - 1);
        }
        // テキストが空になってもノードは削除しない
      } else if (e.key === 'Delete') {
        // Delete - ノード削除は禁止、テキスト削除のみ
        if (selectedText) {
          // 選択範囲がある場合は削除
          const newText = currentText.slice(0, selectedText.start) + currentText.slice(selectedText.end);
          setEditingText(newText);
          setCursorPosition(selectedText.start);
          setSelectedText(null);
        } else if (pos < currentText.length) {
          const newText = currentText.slice(0, pos) + currentText.slice(pos + 1);
          setEditingText(newText);
        }
        // テキストが空になってもノードは削除しない
      } else if (e.key === 'Enter') {
        // 改行
        if (selectedText) {
          // 選択範囲がある場合は置き換えてから改行
          const newText = currentText.slice(0, selectedText.start) + '\n' + currentText.slice(selectedText.end);
          setEditingText(newText);
          setCursorPosition(selectedText.start + 1);
          setSelectedText(null);
        } else {
          const newText = currentText.slice(0, pos) + '\n' + currentText.slice(pos);
          setEditingText(newText);
          setCursorPosition(pos + 1);
        }
      } else if (e.key === 'Home') {
        // 行の先頭に移動
        const textBeforeCursor = currentText.slice(0, pos);
        const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
        setCursorPosition(currentLineStart);
        setSelectedText(null); // 選択解除
      } else if (e.key === 'End') {
        // 行の末尾に移動
        const nextNewlineIndex = currentText.indexOf('\n', pos);
        const currentLineEnd = nextNewlineIndex === -1 ? currentText.length : nextNewlineIndex;
        setCursorPosition(currentLineEnd);
        setSelectedText(null); // 選択解除
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        // 全選択
        setSelectedText({ start: 0, end: currentText.length });
        setCursorPosition(currentText.length);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // 通常の文字入力
        if (selectedText) {
          // 選択範囲がある場合は置き換え
          const newText = currentText.slice(0, selectedText.start) + e.key + currentText.slice(selectedText.end);
          setEditingText(newText);
          setCursorPosition(selectedText.start + 1);
          setSelectedText(null); // 選択解除
        } else {
          // 通常の挿入
          const newText = currentText.slice(0, pos) + e.key + currentText.slice(pos);
          setEditingText(newText);
          setCursorPosition(pos + 1);
        }
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
      setCursorVisible(true);
    }
  }, [node.isEditing, node.text]);

  // カーソル点滅エフェクト
  useEffect(() => {
    if (!node.isEditing) return;

    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530); // 標準的な点滅間隔

    return () => clearInterval(interval);
  }, [node.isEditing]);

  // 接続状態が変わったらアクティブな接続点をクリア
  useEffect(() => {
    if (!canvasState.isConnecting) {
      setActiveConnectionPoint(null);
    }
  }, [canvasState.isConnecting]);

  // キー入力時にカーソルを表示状態にリセット + ノードサイズ更新
  useEffect(() => {
    if (node.isEditing) {
      setCursorVisible(true);
      
      // リアルタイムでノードサイズを更新
      updateNodeSizeForText(editingText);
    }
  }, [cursorPosition, editingText]);

  // テキストに応じてノードサイズを計算・更新
  const updateNodeSizeForText = (text: string) => {
    const lineHeight = 20;
    const padding = 16;
    const minWidth = 120;
    const maxWidth = 300;
    const minHeight = 60;
    const charWidth = 8; // 1文字あたりの概算幅
    
    // 手動改行による行分割
    const manualLines = text.split('\n');
    
    // 各手動改行行について、自動折り返しを考慮した実際の行数を計算
    let totalDisplayLines = 0;
    let maxRequiredWidth = minWidth;
    
    for (const line of manualLines) {
      if (line.length === 0) {
        // 空行も1行としてカウント
        totalDisplayLines += 1;
        continue;
      }
      
      // この行に必要な幅を計算
      const lineRequiredWidth = line.length * charWidth + padding;
      maxRequiredWidth = Math.max(maxRequiredWidth, Math.min(maxWidth, lineRequiredWidth));
      
      // 現在の幅での折り返し行数を計算
      const availableWidth = Math.min(maxWidth, Math.max(minWidth, lineRequiredWidth)) - padding;
      const charsPerLine = Math.floor(availableWidth / charWidth);
      const wrappedLines = Math.ceil(line.length / charsPerLine) || 1;
      
      totalDisplayLines += wrappedLines;
    }
    
    // 最終的な幅と高さを決定
    const finalWidth = Math.max(minWidth, Math.min(maxWidth, maxRequiredWidth));
    const finalHeight = Math.max(minHeight, totalDisplayLines * lineHeight + padding);
    
    // ノードサイズを更新（編集中のみ）
    updateNode(node.id, {
      size: {
        width: finalWidth,
        height: finalHeight,
      }
    });
  };

  // カーソル付きテキストを生成
  const getDisplayTextWithCursor = () => {
    const text = editingText;
    const pos = cursorPosition;
    // カーソルが見える時のみ '|' を挿入
    const cursor = cursorVisible ? '|' : '';
    return text.slice(0, pos) + cursor + text.slice(pos);
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
    
    // Get current canvas state
    const canvasState = useMindmapStore.getState().canvas;
    
    // Handle connection editing mode
    if (canvasState.isEditingConnection && canvasState.editingConnectionId) {
      console.log('Connection editing mode: updating connection endpoint');
      updateConnectionEndpoint(canvasState.editingConnectionId, node.id);
      setActiveConnectionPoint(null);
      return;
    }
    
    // Handle normal connection creation mode
    if (canvasState.isConnecting && canvasState.connectionStartPoint !== pointId) {
      // This is a valid drop target
      endConnection(pointId);
    } else if (canvasState.isConnecting) {
      // Same connection point or invalid drop, cancel connection
      endConnection();
    }
    
    // Always clear active connection point after handling
    setActiveConnectionPoint(null);
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
    
    // Update node position and save to history (for undo/redo)
    updateNode(node.id, {
      position: {
        x: position.x,
        y: position.y,
      },
    }, true); // true = save to history
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
        wrap="word"
        verticalAlign="middle"
      />
      
      {/* Direct Konva text editing - no overlay needed */}
      
      {/* Connection points - shown when not editing, with special handling for connection editing/selection */}
      {!node.isEditing && (() => {
        const store = useMindmapStore.getState();
        
        // During connection editing, hide connection points on nodes that are part of the edited connection
        if (canvasState.isEditingConnection && canvasState.editingConnectionId) {
          const editingConnection = store.connections.find(c => c.id === canvasState.editingConnectionId);
          // Hide connection points if this node is the source or target of the edited connection
          if (editingConnection && (editingConnection.from === node.id || editingConnection.to === node.id)) {
            return false;
          }
        }
        
        // Also hide connection points when any connection involving this node is selected
        // This prevents connection points from overlapping with connection handles
        if (store.selectedConnectionId) {
          const selectedConnection = store.connections.find(c => c.id === store.selectedConnectionId);
          if (selectedConnection && (selectedConnection.from === node.id || selectedConnection.to === node.id)) {
            return false;
          }
        }
        
        return true;
      })() && connectionPoints.map((point) => (
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

      {/* Editing hint - shown when editing */}
      {node.isEditing && (
        <Group>
          {/* Hint background */}
          <Rect
            x={0}
            y={node.size.height + 8}
            width={Math.max(node.size.width, 280)}
            height={24}
            fill="rgba(0, 123, 255, 0.1)"
            stroke="#007bff"
            strokeWidth={1}
            cornerRadius={4}
          />
          {/* Hint text */}
          <Text
            text="Ctrl+Enter: 保存 | Esc: キャンセル | 外クリック: 自動保存"
            x={8}
            y={node.size.height + 14}
            fontSize={11}
            fontFamily="Arial, sans-serif"
            fill="#007bff"
            align="left"
          />
        </Group>
      )}
    </Group>
  );
};