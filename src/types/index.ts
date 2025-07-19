// Core data types for Mindmapify

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface NodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
}

export interface ConnectionPoint {
  id: string;
  nodeId: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  isActive?: boolean;
  isHovered?: boolean;
}

export interface ConnectionStyle {
  strokeColor?: string;
  strokeWidth?: number;
}

export interface Node {
  id: string;
  text: string;
  position: Position;
  size: Size;
  style?: NodeStyle;
  isEditing?: boolean;
  isSelected?: boolean;
  connectionPoints?: ConnectionPoint[];
}

export interface Connection {
  id: string;
  from: string; // Node ID
  to: string;   // Node ID
  label?: string; // Relationship label
  style?: ConnectionStyle;
  isSelected?: boolean;
}

export interface CanvasState {
  offset: Position;
  zoom: number;
  isDragging: boolean;
  isConnecting?: boolean;
  connectionStartPoint?: string; // Connection point ID
  connectionStartPosition?: Position; // Absolute position for dashed arrow
  connectionEndPosition?: Position; // Mouse position for dashed arrow
}

export interface MindmapState {
  nodes: Node[];
  connections: Connection[];
  selectedNodeId?: string;
  selectedConnectionId?: string;
  canvas: CanvasState;
  history: {
    past: MindmapSnapshot[];
    present: MindmapSnapshot;
    future: MindmapSnapshot[];
  };
}

export interface MindmapSnapshot {
  nodes: Node[];
  connections: Connection[];
}

// Action types for better type safety
export interface NodeActions {
  addNode: (position: Position, text?: string) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | undefined) => void;
  startEditing: (id: string) => void;
  stopEditing: (id: string) => void;
  stopAllEditing: () => void;
}

export interface ConnectionActions {
  addConnection: (fromId: string, toId: string) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  selectConnection: (id: string | undefined) => void;
}

export interface CanvasActions {
  setCanvasOffset: (offset: Position) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasDragging: (isDragging: boolean) => void;
  startConnection: (connectionPointId: string, startPosition: Position) => void;
  updateConnectionPreview: (endPosition: Position) => void;
  endConnection: (targetConnectionPointId?: string) => void;
}

export interface HistoryActions {
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;
}

export type MindmapActions = NodeActions & ConnectionActions & CanvasActions & HistoryActions;

// Relationship labels for logical connections
export const RELATION_LABELS = [
  '具体例', '根拠', '結果', '同類',
  '詳細', '原因', '手段', '対比',
  '解決策', '前提', '要素', '補完'
] as const;

export type RelationLabel = typeof RELATION_LABELS[number];