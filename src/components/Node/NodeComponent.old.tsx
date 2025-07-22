import React, { useState, useEffect } from 'react';
import { Rect, Text, Group } from 'react-konva';
import { useMindmapStore } from '../../stores/mindmapStore';
// import { TextEditor } from './TextEditor';  // REMOVED - using direct Konva editing
import { ConnectionPointComponent } from './ConnectionPoint';
import type { Node, ConnectionPoint, Position } from '../../types';

interface NodeComponentProps {
  node: Node;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({ node }) => {
  const { updateNode, selectNode, startEditing, stopEditing, startConnection, endConnection, updateConnectionEndpoint, cancelConnectionEndpointEdit, toggleNodeSelection } = useMindmapStore();
  const selectedNodeIds = useMindmapStore(state => state.selectedNodeIds);
  const canvasState = useMindmapStore(state => state.canvas);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<string | null>(null);
  const [activeConnectionPoint, setActiveConnectionPoint] = useState<string | null>(null);
  const [editingText, setEditingText] = useState(node.text);
  const [cursorPosition, setCursorPosition] = useState(node.text.length);
  const [cursorVisible, setCursorVisible] = useState(true);
  
  // ダブルクリック検出用の状態
  const [lastClickTime, setLastClickTime] = useState(0);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // ノードサイズ更新のdebounce用
  const [sizeUpdateTimeout, setSizeUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // 複数ノードドラッグ用の状態
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null);
  const [otherNodesStartPositions, setOtherNodesStartPositions] = useState<Map<string, {x: number, y: number}>>(new Map());
  // 日本語入力用の状態
  const [isComposing, setIsComposing] = useState(false);
  const [compositionText, setCompositionText] = useState('');
  // const [selectedText, setSelectedText] = useState<{start: number, end: number} | null>(null);
  // const textRef = useRef<any>(null);
  // const groupRef = useRef<any>(null);

  const handleClick = (e: any) => {
    // Prevent event bubbling to canvas to avoid connection hit testing
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.preventDefault();
    }
    
    // Capture modifier keys immediately
    const isCtrlOrCmd = e.evt && (e.evt.ctrlKey || e.evt.metaKey);
    
    // If Ctrl/Cmd is held, process immediately without delay
    if (isCtrlOrCmd) {
      toggleNodeSelection(node.id);
      return;
    }
    
    // ダブルクリック検出
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    // ダブルクリック判定（400ms以内の連続クリック）
    if (timeDiff < 400) {
      console.log('🚫 Double-click detected - ignoring to prevent edit issues');
      // ダブルクリックの場合は処理を中断
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        setClickTimeout(null);
      }
      setLastClickTime(currentTime);
      return;
    }
    
    setLastClickTime(currentTime);
    
    // シングルクリック処理を少し遅延させてダブルクリックでないことを確認
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSingleClick();
      setClickTimeout(null);
    }, 200); // 200ms待ってからシングルクリック処理
    
    setClickTimeout(timeout);
  };

  const handleSingleClick = () => {
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

  // ダブルクリックを明示的に無効化
  const handleDoubleClick = (e: any) => {
    console.log('🚫 Double-click explicitly prevented');
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
      e.evt.preventDefault();
    }
    // 何もしない（ダブルクリック動作を完全無効化）
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

  // const handleTextChange = (newText: string) => {
  //   setEditingText(newText); // Update display text in real-time
  // };

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
  // Note: When HTML overlay is used, this keyboard handler is disabled
  useEffect(() => {
    // Disable Konva keyboard handling when using HTML overlay
    return;
    
    if (!node.isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key, 'editing:', node.isEditing, 'cursor:', cursorPosition, 'composing:', isComposing);
      
      // IME変換中はキー入力を処理しない
      if (isComposing) {
        return;
      }
      
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

      // 制御キー以外の場合はブラウザのデフォルト動作を防ぐ
      // ただし、IMEを使用する可能性のある文字入力は除外
      const isControlKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace', 'Delete', 'Enter', 'Home', 'End', 'Escape'].includes(e.key);
      const isShortcutKey = (e.ctrlKey || e.metaKey) && ['a', 'v', 'Enter'].includes(e.key);
      
      if (isControlKey || isShortcutKey) {
        e.preventDefault(); // ブラウザのデフォルト動作を防ぐ
      }
      e.stopPropagation(); // Canvasのキーボードハンドリングを防ぐ

      if (e.key === 'ArrowLeft') {
        // カーソル左移動
        setCursorPosition(Math.max(0, pos - 1));
        // setSelectedText(null); // 選択解除
      } else if (e.key === 'ArrowRight') {
        // カーソル右移動
        setCursorPosition(Math.min(currentText.length, pos + 1));
        // setSelectedText(null); // 選択解除
      } else if (e.key === 'ArrowUp') {
        // カーソル上移動（行間移動）
        // const lines = currentText.split('\n');
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
        // setSelectedText(null); // 選択解除
      } else if (e.key === 'ArrowDown') {
        // カーソル下移動（行間移動）
        // const lines = currentText.split('\n');
        const textBeforeCursor = currentText.slice(0, pos);
        const currentLineIndex = textBeforeCursor.split('\n').length - 1;
        
        const lines = currentText.split('\n');
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
        // setSelectedText(null); // 選択解除
      } else if (e.key === 'Backspace') {
        // バックスペース - ノード削除は禁止、テキスト削除のみ
        // if (selectedText) {
        //   // 選択範囲がある場合は削除
        //   const newText = currentText.slice(0, selectedText.start) + currentText.slice(selectedText.end);
        //   setEditingText(newText);
        //   setCursorPosition(selectedText.start);
        //   setSelectedText(null);
        // } else
        if (pos > 0) {
          const newText = currentText.slice(0, pos - 1) + currentText.slice(pos);
          setEditingText(newText);
          setCursorPosition(pos - 1);
        }
        // テキストが空になってもノードは削除しない
      } else if (e.key === 'Delete') {
        // Delete - ノード削除は禁止、テキスト削除のみ
        // if (selectedText) {
        //   // 選択範囲がある場合は削除
        //   const newText = currentText.slice(0, selectedText.start) + currentText.slice(selectedText.end);
        //   setEditingText(newText);
        //   setCursorPosition(selectedText.start);
        //   setSelectedText(null);
        // } else
        if (pos < currentText.length) {
          const newText = currentText.slice(0, pos) + currentText.slice(pos + 1);
          setEditingText(newText);
        }
        // テキストが空になってもノードは削除しない
      } else if (e.key === 'Enter') {
        // 改行
        // if (selectedText) {
        //   // 選択範囲がある場合は置き換えてから改行
        //   const newText = currentText.slice(0, selectedText.start) + '\n' + currentText.slice(selectedText.end);
        //   setEditingText(newText);
        //   setCursorPosition(selectedText.start + 1);
        //   setSelectedText(null);
        // } else {
          const newText = currentText.slice(0, pos) + '\n' + currentText.slice(pos);
          setEditingText(newText);
          setCursorPosition(pos + 1);
        // }
      } else if (e.key === 'Home') {
        // 行の先頭に移動
        const textBeforeCursor = currentText.slice(0, pos);
        const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
        setCursorPosition(currentLineStart);
        // setSelectedText(null); // 選択解除
      } else if (e.key === 'End') {
        // 行の末尾に移動
        const nextNewlineIndex = currentText.indexOf('\n', pos);
        const currentLineEnd = nextNewlineIndex === -1 ? currentText.length : nextNewlineIndex;
        setCursorPosition(currentLineEnd);
        // setSelectedText(null); // 選択解除
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        // 全選択
        // setSelectedText({ start: 0, end: currentText.length });
        setCursorPosition(currentText.length);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // 通常の文字入力（英数字のみ、日本語はcompositionイベントで処理）
        e.preventDefault(); // 英数字の場合のみpreventDefault
        // if (selectedText) {
        //   // 選択範囲がある場合は置き換え
        //   const newText = currentText.slice(0, selectedText.start) + e.key + currentText.slice(selectedText.end);
        //   setEditingText(newText);
        //   setCursorPosition(selectedText.start + 1);
        //   // setSelectedText(null); // 選択解除
        // } else {
          // 通常の挿入
          const newText = currentText.slice(0, pos) + e.key + currentText.slice(pos);
          setEditingText(newText);
          setCursorPosition(pos + 1);
        // }
      }
    };

    // IME関連のイベントハンドラー
    const handleCompositionStart = () => {
      console.log('Composition started');
      setIsComposing(true);
      setCompositionText('');
    };

    const handleCompositionUpdate = (e: CompositionEvent) => {
      console.log('Composition update:', e.data);
      setCompositionText(e.data);
    };

    const handleCompositionEnd = (e: CompositionEvent) => {
      console.log('Composition ended:', e.data);
      setIsComposing(false);
      
      // 確定したテキストを挿入
      if (e.data) {
        const currentText = editingText;
        const pos = cursorPosition;
        const newText = currentText.slice(0, pos) + e.data + currentText.slice(pos);
        setEditingText(newText);
        setCursorPosition(pos + e.data.length);
      }
      setCompositionText('');
    };
    
    // input イベントハンドラー（日本語直接入力対応）
    const handleInput = (e: Event) => {
      // Konvaのテキスト編集では input イベントを処理する必要がある場合がある
      console.log('Input event:', e);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('compositionstart', handleCompositionStart);
    document.addEventListener('compositionupdate', handleCompositionUpdate);
    document.addEventListener('compositionend', handleCompositionEnd);
    document.addEventListener('input', handleInput);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('compositionstart', handleCompositionStart);
      document.removeEventListener('compositionupdate', handleCompositionUpdate);
      document.removeEventListener('compositionend', handleCompositionEnd);
      document.removeEventListener('input', handleInput);
    };
  }, [node.isEditing, editingText, cursorPosition, isComposing]);

  // 編集モード開始時の初期化
  useEffect(() => {
    if (node.isEditing) {
      setEditingText(node.text);
      setCursorPosition(node.text.length);
      setCursorVisible(true);
    }
  }, [node.isEditing, node.text]);

  // クリーンアップ: タイムアウトを確実にクリア
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
      if (sizeUpdateTimeout) {
        clearTimeout(sizeUpdateTimeout);
      }
    };
  }, [clickTimeout, sizeUpdateTimeout]);

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

  // 接続編集状態が変わったらホバー状態をクリア
  useEffect(() => {
    if (!canvasState.isEditingConnection) {
      setHoveredConnectionPoint(null);
      setActiveConnectionPoint(null);
    }
  }, [canvasState.isEditingConnection]);

  // 接続完了時にもホバー状態をクリア
  useEffect(() => {
    if (!canvasState.isConnecting) {
      setHoveredConnectionPoint(null);
    }
  }, [canvasState.isConnecting]);

  // キー入力時にカーソルを表示状態にリセット
  useEffect(() => {
    if (node.isEditing) {
      setCursorVisible(true);
    }
  }, [cursorPosition, node.isEditing]);

  // テキスト変更時のみノードサイズを更新（debounce適用）
  useEffect(() => {
    if (node.isEditing) {
      // 既存のタイムアウトをクリア
      if (sizeUpdateTimeout) {
        clearTimeout(sizeUpdateTimeout);
      }
      
      // 100ms後にサイズ更新（連続入力時の再計算を防ぐ）
      const timeout = setTimeout(() => {
        // IME変換中のテキストも含めてサイズ計算
        const displayText = isComposing && compositionText 
          ? editingText.slice(0, cursorPosition) + compositionText + editingText.slice(cursorPosition)
          : editingText;
        updateNodeSizeForText(displayText);
        setSizeUpdateTimeout(null);
      }, 100);
      
      setSizeUpdateTimeout(timeout);
    }
  }, [editingText, node.isEditing, isComposing, compositionText, cursorPosition]);

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

  // カーソル付きテキストを生成（IME変換中のテキストも表示）
  const getDisplayTextWithCursor = () => {
    const text = editingText;
    const pos = cursorPosition;
    
    // IME変換中の場合は、変換中のテキストを挿入位置に表示
    if (isComposing && compositionText) {
      const beforeComposition = text.slice(0, pos);
      const afterComposition = text.slice(pos);
      // カーソルが見える時のみ '|' を挿入（変換中は変換テキストの後ろに）
      const cursor = cursorVisible ? '|' : '';
      return beforeComposition + compositionText + cursor + afterComposition;
    }
    
    // 通常の場合
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
    
    // Don't start new connection if we're in editing mode
    if (!canvasState.isEditingConnection) {
      console.log('🔗 Starting new connection from:', pointId);
      const absolutePosition = getAbsoluteConnectionPointPosition(pointId);
      startConnection(pointId, absolutePosition);
    } else {
      console.log('🔧 In editing mode, skipping new connection start');
    }
  };

  const handleConnectionPointMouseUp = (pointId: string, e: any) => {
    e.cancelBubble = true;
    
    // Get current canvas state
    const canvasState = useMindmapStore.getState().canvas;
    
    // Handle connection editing mode
    if (canvasState.isEditingConnection && canvasState.editingConnectionId) {
      console.log('🔧 Connection editing mode: updating connection endpoint to node:', node.id);
      updateConnectionEndpoint(canvasState.editingConnectionId, node.id);
      setActiveConnectionPoint(null);
      console.log('🔧 Connection editing completed, returning early');
      return; // Important: return here to avoid executing normal connection logic
    }
    
    // Handle normal connection creation mode (only if not in editing mode)
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
    // Prevent dragging if Ctrl/Cmd is held (selection mode)
    if (e.evt && (e.evt.ctrlKey || e.evt.metaKey)) {
      e.target.stopDrag();
      return;
    }
    
    // Prevent stage from dragging when dragging nodes
    const stage = e.target.getStage();
    stage.draggable(false);
    
    // Store initial position for multiple node dragging
    setDragStartPosition({ x: node.position.x, y: node.position.y });
    
    // If multiple nodes are selected, store their initial positions
    if (selectedNodeIds.size > 1 && node.isSelected) {
      const nodes = useMindmapStore.getState().nodes;
      const initialPositions = new Map<string, {x: number, y: number}>();
      
      selectedNodeIds.forEach(id => {
        if (id !== node.id) { // Skip the currently dragged node
          const otherNode = nodes.find(n => n.id === id);
          if (otherNode) {
            initialPositions.set(id, { x: otherNode.position.x, y: otherNode.position.y });
          }
        }
      });
      
      setOtherNodesStartPositions(initialPositions);
    }
  };

  const handleDragMove = (e: any) => {
    // If multiple nodes are selected and this node is selected
    if (selectedNodeIds.size > 1 && node.isSelected && dragStartPosition && otherNodesStartPositions.size > 0) {
      const position = e.target.position();
      const deltaX = position.x - dragStartPosition.x;
      const deltaY = position.y - dragStartPosition.y;
      
      // Update all selected nodes' positions based on their initial positions
      otherNodesStartPositions.forEach((startPos, id) => {
        updateNode(id, {
          position: {
            x: startPos.x + deltaX,
            y: startPos.y + deltaY,
          },
        });
      });
    }
  };

  const handleDragEnd = (e: any) => {
    // Re-enable stage dragging
    const stage = e.target.getStage();
    stage.draggable(true);
    
    // Get the actual position
    const position = e.target.position();
    
    if (selectedNodeIds.size > 1 && node.isSelected && dragStartPosition) {
      // Calculate final delta
      const deltaX = position.x - dragStartPosition.x;
      const deltaY = position.y - dragStartPosition.y;
      
      // Save history for all selected nodes
      const updates: Array<{id: string, position: {x: number, y: number}}> = [];
      
      // Add the dragged node
      updates.push({ id: node.id, position: { x: position.x, y: position.y } });
      
      // Add other selected nodes with their new positions
      otherNodesStartPositions.forEach((startPos, id) => {
        updates.push({
          id,
          position: {
            x: startPos.x + deltaX,
            y: startPos.y + deltaY,
          }
        });
      });
      
      // Update all nodes and save to history
      updates.forEach(({ id, position }) => {
        updateNode(id, { position }, id === node.id); // Only save history for the main dragged node
      });
      
      // Save history once for the entire operation
      useMindmapStore.getState().saveSnapshot();
    } else {
      // Single node update
      updateNode(node.id, {
        position: {
          x: position.x,
          y: position.y,
        },
      }, true); // true = save to history
    }
    
    // Clear drag start positions
    setDragStartPosition(null);
    setOtherNodesStartPositions(new Map());
  };

  // Visual style based on state
  // 編集モード: 青色（#007bff）
  // 選択モード: 水色（#17a2b8）
  // 通常: 白色
  const fillColor = node.isEditing ? '#007bff' : (node.isSelected ? '#17a2b8' : '#ffffff');
  const strokeColor = node.isEditing ? '#0056b3' : (node.isSelected ? '#138496' : '#dee2e6');
  const strokeWidth = (node.isEditing || node.isSelected) ? 2 : 1;
  const textColor = node.isEditing ? '#ffffff' : (node.isSelected ? '#ffffff' : '#212529');

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable={!node.isEditing} // Disable dragging while editing
      onClick={handleClick}
      onTap={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      listening={true}
    >
      {/* Node background */}
      <Rect
        width={node.size.width}
        height={node.size.height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        cornerRadius={8}
        shadowBlur={node.isEditing ? 12 : (node.isSelected ? 8 : 5)}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowOffsetY={2}
      />
      
      {/* Node text - hide when editing (HTML overlay will show instead) */}
      {!node.isEditing && (
        <Text
          text={node.text}
          x={8}
          y={8}
          width={node.size.width - 16}
          fontSize={14}
          fontFamily="Arial, sans-serif"
          fill={textColor}
          align="center"
          lineHeight={1.4}
          wrap="word"
          verticalAlign="middle"
        />
      )}
      
      {/* Direct Konva text editing - no overlay needed */}
      
      {/* Connection points (background layer) - always shown when not editing */}
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
          key={`bg-${point.id}`}
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
          {/* Hint text - no background box */}
          <Text
            text="Ctrl+Enter: 保存 | Esc: キャンセル | 外クリック: 自動保存"
            x={8}
            y={node.size.height + 12}
            fontSize={10}
            fontFamily="Arial, sans-serif"
            fill="#6c757d"
            align="left"
          />
        </Group>
      )}

      {/* Connection points (top layer) - shown during node editing or connection editing mode */}
      {(node.isEditing || (canvasState.isEditingConnection && (() => {
        const store = useMindmapStore.getState();
        const editingConnection = store.connections.find(c => c.id === canvasState.editingConnectionId);
        return editingConnection && (editingConnection.from !== node.id && editingConnection.to !== node.id);
      })())) && connectionPoints.map((point) => (
        <ConnectionPointComponent
          key={`top-${point.id}`}
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