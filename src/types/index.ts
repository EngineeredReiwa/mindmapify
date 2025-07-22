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
  fromSide?: 'top' | 'right' | 'bottom' | 'left'; // Fixed connection point on source node
  toSide?: 'top' | 'right' | 'bottom' | 'left';   // Fixed connection point on target node
  label?: string; // Relationship label
  style?: ConnectionStyle;
  isSelected?: boolean;
  isEditingLabel?: boolean; // Label editing state
}

export interface CanvasState {
  offset: Position;
  zoom: number;
  isDragging: boolean;
  isConnecting?: boolean;
  connectionStartPoint?: string; // Connection point ID
  connectionStartPosition?: Position; // Absolute position for dashed arrow
  connectionEndPosition?: Position; // Mouse position for dashed arrow
  isEditingConnection?: boolean; // Whether editing connection endpoints
  editingConnectionId?: string; // ID of connection being edited
  editingEndpoint?: 'start' | 'end'; // Which endpoint is being modified
  editingPreviewPosition?: Position; // Mouse position during endpoint editing for preview
  originalConnectionState?: { // Store original state for revert capability
    from: string;
    to: string;
    fromSide?: 'top' | 'right' | 'bottom' | 'left';
    toSide?: 'top' | 'right' | 'bottom' | 'left';
  };
  hoveredConnectionPoint?: string; // Currently hovered connection point ID
  activeConnectionPoint?: string; // Currently active connection point ID
}

export interface MindmapState {
  nodes: Node[];
  connections: Connection[];
  selectedNodeId?: string; // 主選択ノード（最後に選択されたノード）
  selectedNodeIds: Set<string>; // 複数選択されたノードのIDセット
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
  updateNode: (id: string, updates: Partial<Node>, saveHistory?: boolean) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  selectNode: (id: string | undefined) => void;
  toggleNodeSelection: (id: string) => void;
  selectNodes: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  duplicateSelectedNodes: () => void;
  updateSelectedNodes: (updates: Partial<Node>, saveHistory?: boolean) => void;
  startEditing: (id: string) => void;
  stopEditing: (id: string) => void;
  stopAllEditing: () => void;
  saveAndStopAllEditing: () => void;
}

export interface ConnectionActions {
  addConnection: (fromId: string, toId: string) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  selectConnection: (id: string | undefined) => void;
  startEditingConnectionLabel: (id: string) => void;
  stopEditingConnectionLabel: (id: string) => void;
  startEditingConnectionEndpoint: (connectionId: string, endpoint: 'start' | 'end') => void;
  updateConnectionEndpoint: (connectionId: string, newNodeId: string) => void;
  cancelConnectionEndpointEdit: () => void;
}

export interface CanvasActions {
  setCanvasOffset: (offset: Position) => void;
  setCanvasZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setCanvasDragging: (isDragging: boolean) => void;
  startConnection: (connectionPointId: string, startPosition: Position) => void;
  updateConnectionPreview: (endPosition: Position) => void;
  updateEditingPreview: (mousePosition: Position) => void;
  endConnection: (targetConnectionPointId?: string) => void;
  cancelConnectionCreation: () => void;
  setHoveredConnectionPoint: (pointId: string | undefined) => void;
  setActiveConnectionPoint: (pointId: string | undefined) => void;
}

export interface HistoryActions {
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;
}

export type MindmapActions = NodeActions & ConnectionActions & CanvasActions & HistoryActions;

// Relationship labels for logical connections
export const RELATION_LABELS = [
  '原因', '結果', '手段', '具体例',
  '要素', '同類', '対比', '補完'
] as const;

export type RelationLabel = typeof RELATION_LABELS[number];