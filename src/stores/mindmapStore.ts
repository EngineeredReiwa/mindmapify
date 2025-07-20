import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { 
  MindmapState, 
  MindmapActions, 
  Position, 
  Node, 
  MindmapSnapshot 
} from '../types';

// Default values
const DEFAULT_NODE_SIZE = { width: 120, height: 60 };
const DEFAULT_CANVAS_STATE = {
  offset: { x: 0, y: 0 },
  zoom: 1,
  isDragging: false,
  isConnecting: false,
  connectionStartPoint: undefined,
  connectionStartPosition: undefined,
  connectionEndPosition: undefined,
};

// Initial state
const initialSnapshot: MindmapSnapshot = {
  nodes: [],
  connections: [],
};

const initialState: MindmapState = {
  nodes: [],
  connections: [],
  selectedNodeId: undefined,
  selectedConnectionId: undefined,
  canvas: DEFAULT_CANVAS_STATE,
  history: {
    past: [],
    present: initialSnapshot,
    future: [],
  },
};

export const useMindmapStore = create<MindmapState & MindmapActions>()(
  immer((set) => ({
    ...initialState,

    // Node Actions
    addNode: (position: Position, text = 'New Node') => {
      set((state) => {
        const newNode: Node = {
          id: uuidv4(),
          text,
          position,
          size: DEFAULT_NODE_SIZE,
          isEditing: false,
          isSelected: false,
        };
        
        state.nodes.push(newNode);
        state.selectedNodeId = newNode.id;
        
        // Save to history
        state.history.past.push(state.history.present);
        state.history.present = {
          nodes: [...state.nodes],
          connections: [...state.connections],
        };
        state.history.future = [];
      });
    },

    updateNode: (id: string, updates: Partial<Node>) => {
      set((state) => {
        const nodeIndex = state.nodes.findIndex(node => node.id === id);
        if (nodeIndex !== -1) {
          Object.assign(state.nodes[nodeIndex], updates);
        }
      });
    },

    deleteNode: (id: string) => {
      set((state) => {
        // Remove node
        state.nodes = state.nodes.filter(node => node.id !== id);
        
        // Remove all connections to/from this node
        state.connections = state.connections.filter(
          conn => conn.from !== id && conn.to !== id
        );
        
        // Clear selection if deleted node was selected
        if (state.selectedNodeId === id) {
          state.selectedNodeId = undefined;
        }
        
        // Save to history
        state.history.past.push(state.history.present);
        state.history.present = {
          nodes: [...state.nodes],
          connections: [...state.connections],
        };
        state.history.future = [];
      });
    },

    selectNode: (id: string | undefined) => {
      set((state) => {
        // Clear all selections first
        state.nodes.forEach(node => node.isSelected = false);
        state.selectedConnectionId = undefined;
        
        // Set new selection
        state.selectedNodeId = id;
        if (id) {
          const node = state.nodes.find(n => n.id === id);
          if (node) {
            node.isSelected = true;
          }
        }
      });
    },

    startEditing: (id: string) => {
      set((state) => {
        const node = state.nodes.find(n => n.id === id);
        if (node) {
          node.isEditing = true;
        }
      });
    },

    stopEditing: (id: string) => {
      set((state) => {
        const node = state.nodes.find(n => n.id === id);
        if (node) {
          node.isEditing = false;
        }
      });
    },

    stopAllEditing: () => {
      set((state) => {
        state.nodes.forEach(node => {
          node.isEditing = false;
        });
      });
    },

    // Auto-save and stop editing when clicking outside
    saveAndStopAllEditing: () => {
      set((state) => {
        state.nodes.forEach(node => {
          // Note: This function will be called from Canvas, 
          // but the actual text content is managed in NodeComponent
          // The NodeComponent will need to handle the save logic
          node.isEditing = false;
        });
      });
    },

    // Connection Actions
    addConnection: (fromId: string, toId: string) => {
      set((state) => {
        // Check if connection already exists
        const exists = state.connections.some(
          conn => (conn.from === fromId && conn.to === toId) ||
                  (conn.from === toId && conn.to === fromId)
        );
        
        if (!exists && fromId !== toId) {
          const newConnection = {
            id: uuidv4(),
            from: fromId,
            to: toId,
            isSelected: false,
          };
          
          state.connections.push(newConnection);
          
          // Save to history
          state.history.past.push(state.history.present);
          state.history.present = {
            nodes: [...state.nodes],
            connections: [...state.connections],
          };
          state.history.future = [];
        }
      });
    },

    updateConnection: (id: string, updates: Partial<import('../types').Connection>) => {
      set((state) => {
        const connectionIndex = state.connections.findIndex(conn => conn.id === id);
        if (connectionIndex !== -1) {
          Object.assign(state.connections[connectionIndex], updates);
          
          // Save to history
          state.history.past.push(state.history.present);
          state.history.present = {
            nodes: [...state.nodes],
            connections: [...state.connections],
          };
          state.history.future = [];
        }
      });
    },

    deleteConnection: (id: string) => {
      set((state) => {
        state.connections = state.connections.filter(conn => conn.id !== id);
        
        if (state.selectedConnectionId === id) {
          state.selectedConnectionId = undefined;
        }
        
        // Save to history
        state.history.past.push(state.history.present);
        state.history.present = {
          nodes: [...state.nodes],
          connections: [...state.connections],
        };
        state.history.future = [];
      });
    },

    selectConnection: (id: string | undefined) => {
      set((state) => {
        // Clear node selections
        state.nodes.forEach(node => node.isSelected = false);
        state.selectedNodeId = undefined;
        
        // Clear connection selections
        state.connections.forEach(conn => conn.isSelected = false);
        
        // Set new selection
        state.selectedConnectionId = id;
        if (id) {
          const connection = state.connections.find(c => c.id === id);
          if (connection) {
            connection.isSelected = true;
          }
        }
      });
    },

    startEditingConnectionLabel: (id: string) => {
      set((state) => {
        const connection = state.connections.find(c => c.id === id);
        if (connection) {
          connection.isEditingLabel = true;
        }
      });
    },

    stopEditingConnectionLabel: (id: string) => {
      set((state) => {
        const connection = state.connections.find(c => c.id === id);
        if (connection) {
          connection.isEditingLabel = false;
        }
      });
    },

    startEditingConnectionEndpoint: (connectionId: string, endpoint: 'start' | 'end') => {
      set((state) => {
        state.canvas.isEditingConnection = true;
        state.canvas.editingConnectionId = connectionId;
        state.canvas.editingEndpoint = endpoint;
      });
    },

    updateConnectionEndpoint: (connectionId: string, newNodeId: string) => {
      console.log('🔧 Store: updateConnectionEndpoint called', { connectionId, newNodeId });
      set((state) => {
        const connection = state.connections.find(c => c.id === connectionId);
        const endpoint = state.canvas.editingEndpoint;
        
        console.log('🔧 Store: Found connection:', !!connection, 'endpoint:', endpoint);
        
        if (connection && endpoint) {
          console.log('🔧 Store: Before update - connection.from:', connection.from, 'connection.to:', connection.to);
          
          // Save to history before making changes
          state.history.past.push(state.history.present);
          state.history.future = [];
          
          // Update the appropriate endpoint
          if (endpoint === 'start') {
            connection.from = newNodeId;
            console.log('🔧 Store: Updated start endpoint to:', newNodeId);
          } else {
            connection.to = newNodeId;
            console.log('🔧 Store: Updated end endpoint to:', newNodeId);
          }
          
          console.log('🔧 Store: After update - connection.from:', connection.from, 'connection.to:', connection.to);
          
          // Update present state AFTER making changes
          state.history.present = {
            nodes: [...state.nodes],
            connections: [...state.connections],
          };
          
          // Clear editing state
          state.canvas.isEditingConnection = false;
          state.canvas.editingConnectionId = undefined;
          state.canvas.editingEndpoint = undefined;
          
          console.log('🔧 Store: Editing state cleared');
        } else {
          console.log('🔧 Store: No connection or endpoint found - no update performed');
        }
      });
    },

    cancelConnectionEndpointEdit: () => {
      set((state) => {
        state.canvas.isEditingConnection = false;
        state.canvas.editingConnectionId = undefined;
        state.canvas.editingEndpoint = undefined;
      });
    },

    // Canvas Actions
    setCanvasOffset: (offset: Position) => {
      set((state) => {
        state.canvas.offset = offset;
      });
    },

    setCanvasZoom: (zoom: number) => {
      set((state) => {
        state.canvas.zoom = Math.max(0.1, Math.min(3, zoom));
      });
    },

    zoomIn: () => {
      set((state) => {
        const scaleBy = 1.2;
        state.canvas.zoom = Math.max(0.1, Math.min(3, state.canvas.zoom * scaleBy));
      });
    },

    zoomOut: () => {
      set((state) => {
        const scaleBy = 1.2;
        state.canvas.zoom = Math.max(0.1, Math.min(3, state.canvas.zoom / scaleBy));
      });
    },

    resetZoom: () => {
      set((state) => {
        state.canvas.zoom = 1;
        state.canvas.offset = { x: 0, y: 0 };
      });
    },

    setCanvasDragging: (isDragging: boolean) => {
      set((state) => {
        state.canvas.isDragging = isDragging;
      });
    },

    startConnection: (connectionPointId: string, startPosition: Position) => {
      set((state) => {
        state.canvas.isConnecting = true;
        state.canvas.connectionStartPoint = connectionPointId;
        state.canvas.connectionStartPosition = startPosition;
        state.canvas.connectionEndPosition = startPosition;
      });
    },

    updateConnectionPreview: (endPosition: Position) => {
      set((state) => {
        if (state.canvas.isConnecting) {
          state.canvas.connectionEndPosition = endPosition;
        }
      });
    },

    endConnection: (targetConnectionPointId?: string) => {
      set((state) => {
        if (state.canvas.isConnecting && state.canvas.connectionStartPoint) {
          if (targetConnectionPointId && targetConnectionPointId !== state.canvas.connectionStartPoint) {
            // Extract node IDs from connection point IDs
            // Connection point format: "nodeId-position" where nodeId is full UUID
            const fromNodeId = state.canvas.connectionStartPoint.split('-').slice(0, -1).join('-');
            const toNodeId = targetConnectionPointId.split('-').slice(0, -1).join('-');
            
            // Create connection between nodes
            if (fromNodeId && toNodeId && fromNodeId !== toNodeId) {
              // Check if connection already exists
              const exists = state.connections.some(
                conn => (conn.from === fromNodeId && conn.to === toNodeId) ||
                        (conn.from === toNodeId && conn.to === fromNodeId)
              );
              
              if (!exists) {
                const newConnection = {
                  id: uuidv4(),
                  from: fromNodeId,
                  to: toNodeId,
                  isSelected: false,
                };
                
                state.connections.push(newConnection);
                
                // Save to history
                state.history.past.push(state.history.present);
                state.history.present = {
                  nodes: [...state.nodes],
                  connections: [...state.connections],
                };
                state.history.future = [];
              }
            }
          }
        }
        
        // Reset connection state
        state.canvas.isConnecting = false;
        state.canvas.connectionStartPoint = undefined;
        state.canvas.connectionStartPosition = undefined;
        state.canvas.connectionEndPosition = undefined;
      });
    },

    // History Actions
    undo: () => {
      set((state) => {
        if (state.history.past.length > 0) {
          const previous = state.history.past.pop()!;
          state.history.future.unshift(state.history.present);
          state.history.present = previous;
          
          // Apply the state
          state.nodes = [...previous.nodes];
          state.connections = [...previous.connections];
          
          // Clear selections as they might not be valid
          state.selectedNodeId = undefined;
          state.selectedConnectionId = undefined;
        }
      });
    },

    redo: () => {
      set((state) => {
        if (state.history.future.length > 0) {
          const next = state.history.future.shift()!;
          state.history.past.push(state.history.present);
          state.history.present = next;
          
          // Apply the state
          state.nodes = [...next.nodes];
          state.connections = [...next.connections];
          
          // Clear selections as they might not be valid
          state.selectedNodeId = undefined;
          state.selectedConnectionId = undefined;
        }
      });
    },

    saveSnapshot: () => {
      set((state) => {
        state.history.past.push(state.history.present);
        state.history.present = {
          nodes: [...state.nodes],
          connections: [...state.connections],
        };
        state.history.future = [];
        
        // Limit history size
        if (state.history.past.length > 50) {
          state.history.past.shift();
        }
      });
    },
  }))
);

// Selector helpers for performance
export const useNodes = () => useMindmapStore(state => state.nodes);
export const useConnections = () => useMindmapStore(state => state.connections);
export const useSelectedNodeId = () => useMindmapStore(state => state.selectedNodeId);
export const useCanvasState = () => useMindmapStore(state => state.canvas);

// Make store globally accessible for debugging
if (typeof window !== 'undefined') {
  (window as any).useMindmapStore = useMindmapStore;
}