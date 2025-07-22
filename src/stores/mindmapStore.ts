import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { determineConnectionSides } from '../utils/connectionUtils';
import type { 
  MindmapState, 
  MindmapActions, 
  Position, 
  Node, 
  MindmapSnapshot 
} from '../types';

// Enable Immer MapSet plugin to support Set in state
enableMapSet();

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
  originalConnectionState: undefined,
  hoveredConnectionPoint: undefined,
  activeConnectionPoint: undefined,
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
  selectedNodeIds: new Set<string>(),
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

    updateNode: (id: string, updates: Partial<Node>, saveHistory = false) => {
      set((state) => {
        const nodeIndex = state.nodes.findIndex(node => node.id === id);
        if (nodeIndex !== -1) {
          Object.assign(state.nodes[nodeIndex], updates);
          
          // If position was updated, recalculate connection sides for optimal routing
          if (updates.position) {
            // Update all connections involving this node to use optimal connection points
            state.connections.forEach(connection => {
              if (connection.from === id || connection.to === id) {
                const fromNode = state.nodes.find(n => n.id === connection.from);
                const toNode = state.nodes.find(n => n.id === connection.to);
                
                if (fromNode && toNode) {
                  const sides = determineConnectionSides(fromNode, toNode);
                  connection.fromSide = sides.fromSide;
                  connection.toSide = sides.toSide;
                  console.log('🔧 Store: Auto-updated connection sides after node move:', sides);
                }
              }
            });
          }
          
          // Save to history if explicitly requested (e.g., drag end)
          if (saveHistory) {
            state.history.past.push(state.history.present);
            state.history.present = {
              nodes: [...state.nodes],
              connections: [...state.connections],
            };
            state.history.future = [];
          }
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
        state.selectedNodeIds.delete(id);
        
        // Save to history
        state.history.past.push(state.history.present);
        state.history.present = {
          nodes: [...state.nodes],
          connections: [...state.connections],
        };
        state.history.future = [];
      });
    },

    deleteSelectedNodes: () => {
      set((state) => {
        const selectedIds = Array.from(state.selectedNodeIds);
        if (selectedIds.length === 0) return;
        
        // Remove selected nodes
        state.nodes = state.nodes.filter(node => !state.selectedNodeIds.has(node.id));
        
        // Remove all connections to/from selected nodes
        state.connections = state.connections.filter(
          conn => !selectedIds.includes(conn.from) && !selectedIds.includes(conn.to)
        );
        
        // Clear selections
        state.selectedNodeId = undefined;
        state.selectedNodeIds.clear();
        state.nodes.forEach(node => node.isSelected = false);
        
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
        state.connections.forEach(conn => conn.isSelected = false);
        state.selectedConnectionId = undefined;
        state.selectedNodeIds.clear();
        
        // Set new selection
        state.selectedNodeId = id;
        if (id) {
          const node = state.nodes.find(n => n.id === id);
          if (node) {
            node.isSelected = true;
            state.selectedNodeIds.add(id);
          }
        }
      });
    },

    toggleNodeSelection: (id: string) => {
      set((state) => {
        const node = state.nodes.find(n => n.id === id);
        if (!node) return;
        
        if (state.selectedNodeIds.has(id)) {
          // Deselect node
          node.isSelected = false;
          state.selectedNodeIds.delete(id);
          
          // Update primary selection if needed
          if (state.selectedNodeId === id) {
            const remainingIds = Array.from(state.selectedNodeIds);
            state.selectedNodeId = remainingIds[remainingIds.length - 1] || undefined;
          }
        } else {
          // Select node
          node.isSelected = true;
          state.selectedNodeIds.add(id);
          state.selectedNodeId = id; // Make it the primary selection
        }
        
        // Clear connection selection when selecting nodes
        state.connections.forEach(conn => conn.isSelected = false);
        state.selectedConnectionId = undefined;
      });
    },

    selectNodes: (ids: string[]) => {
      set((state) => {
        // Clear all selections first
        state.nodes.forEach(node => node.isSelected = false);
        state.connections.forEach(conn => conn.isSelected = false);
        state.selectedConnectionId = undefined;
        state.selectedNodeIds.clear();
        
        // Select specified nodes
        ids.forEach(id => {
          const node = state.nodes.find(n => n.id === id);
          if (node) {
            node.isSelected = true;
            state.selectedNodeIds.add(id);
          }
        });
        
        // Set primary selection to last node
        state.selectedNodeId = ids[ids.length - 1] || undefined;
      });
    },

    updateSelectedNodes: (updates: Partial<Node>, saveHistory = false) => {
      set((state) => {
        const selectedIds = Array.from(state.selectedNodeIds);
        if (selectedIds.length === 0) return;
        
        // Update all selected nodes
        selectedIds.forEach(id => {
          const nodeIndex = state.nodes.findIndex(node => node.id === id);
          if (nodeIndex !== -1) {
            Object.assign(state.nodes[nodeIndex], updates);
            
            // If position was updated, recalculate connection sides
            if (updates.position) {
              state.connections.forEach(connection => {
                if (connection.from === id || connection.to === id) {
                  const fromNode = state.nodes.find(n => n.id === connection.from);
                  const toNode = state.nodes.find(n => n.id === connection.to);
                  
                  if (fromNode && toNode) {
                    const sides = determineConnectionSides(fromNode, toNode);
                    connection.fromSide = sides.fromSide;
                    connection.toSide = sides.toSide;
                  }
                }
              });
            }
          }
        });
        
        // Save to history if requested
        if (saveHistory) {
          state.history.past.push(state.history.present);
          state.history.present = {
            nodes: [...state.nodes],
            connections: [...state.connections],
          };
          state.history.future = [];
        }
      });
    },

    selectAll: () => {
      set((state) => {
        // Select all nodes and connections
        state.selectedNodeIds.clear();
        state.nodes.forEach(node => {
          node.isSelected = true;
          state.selectedNodeIds.add(node.id);
        });
        state.connections.forEach(conn => conn.isSelected = true);
        
        // Set primary selection to last node
        state.selectedNodeId = state.nodes.length > 0 ? state.nodes[state.nodes.length - 1].id : undefined;
        state.selectedConnectionId = undefined;
      });
    },

    duplicateSelectedNodes: () => {
      set((state) => {
        const selectedNodeIds = Array.from(state.selectedNodeIds);
        if (selectedNodeIds.length === 0) return;
        
        const duplicatedNodes: Node[] = [];
        const nodeIdMap = new Map<string, string>(); // old ID -> new ID mapping
        
        // Create duplicated nodes
        selectedNodeIds.forEach(id => {
          const originalNode = state.nodes.find(n => n.id === id);
          if (originalNode) {
            const newId = uuidv4();
            const duplicatedNode: Node = {
              ...originalNode,
              id: newId,
              position: {
                x: originalNode.position.x + 50, // Offset by 50px
                y: originalNode.position.y + 50,
              },
              isSelected: true,
              isEditing: false,
            };
            
            duplicatedNodes.push(duplicatedNode);
            nodeIdMap.set(id, newId);
            state.nodes.push(duplicatedNode);
          }
        });
        
        // Update selections to the new nodes
        state.selectedNodeIds.clear();
        duplicatedNodes.forEach(node => {
          state.selectedNodeIds.add(node.id);
        });
        
        // Set primary selection to last duplicated node
        state.selectedNodeId = duplicatedNodes.length > 0 ? duplicatedNodes[duplicatedNodes.length - 1].id : undefined;
        
        // Clear original selections
        state.nodes.forEach(node => {
          if (selectedNodeIds.includes(node.id)) {
            node.isSelected = false;
          }
        });
        
        // Duplicate connections between duplicated nodes
        const originalConnections = [...state.connections];
        originalConnections.forEach(connection => {
          const newFromId = nodeIdMap.get(connection.from);
          const newToId = nodeIdMap.get(connection.to);
          
          // Only duplicate connections that are entirely within the duplicated set
          if (newFromId && newToId) {
            const duplicatedConnection = {
              ...connection,
              id: uuidv4(),
              from: newFromId,
              to: newToId,
              isSelected: false,
            };
            state.connections.push(duplicatedConnection);
          }
        });
        
        // Save to history
        state.history.past.push(state.history.present);
        state.history.present = {
          nodes: [...state.nodes],
          connections: [...state.connections],
        };
        state.history.future = [];
      });
    },

    clearSelection: () => {
      set((state) => {
        // Clear all selections
        state.nodes.forEach(node => node.isSelected = false);
        state.connections.forEach(conn => conn.isSelected = false);
        state.selectedNodeId = undefined;
        state.selectedNodeIds.clear();
        state.selectedConnectionId = undefined;
      });
    },

    startEditing: (id: string) => {
      set((state) => {
        // First, auto-save and stop any connection editing to prevent conflicts
        if (state.canvas.isEditingConnection) {
          console.log('🔧 Store: Auto-stopping connection editing before node editing');
          state.canvas.isEditingConnection = false;
          state.canvas.editingConnectionId = undefined;
          state.canvas.editingEndpoint = undefined;
          state.canvas.editingPreviewPosition = undefined;
        }
        
        // Stop all other node editing to prevent simultaneous editing
        const currentlyEditingNodes = state.nodes.filter(n => n.isEditing && n.id !== id);
        if (currentlyEditingNodes.length > 0) {
          console.log('🔧 Store: Auto-stopping other node editing before starting new edit:', 
            currentlyEditingNodes.map(n => n.id));
          currentlyEditingNodes.forEach(n => {
            n.isEditing = false;
          });
        }
        
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
          // Find the nodes to determine connection sides
          const fromNode = state.nodes.find(n => n.id === fromId);
          const toNode = state.nodes.find(n => n.id === toId);
          
          let fromSide, toSide;
          if (fromNode && toNode) {
            const sides = determineConnectionSides(fromNode, toNode);
            fromSide = sides.fromSide;
            toSide = sides.toSide;
          }
          
          const newConnection = {
            id: uuidv4(),
            from: fromId,
            to: toId,
            fromSide,
            toSide,
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
          // Also clear selection to prevent editing handles from appearing
          connection.isSelected = false;
        }
        
        // Clear connection editing state to prevent unwanted endpoint editing
        state.canvas.isEditingConnection = false;
        state.canvas.editingConnectionId = undefined;
        state.canvas.editingEndpoint = undefined;
        state.canvas.editingPreviewPosition = undefined;
        
        // Clear selected connection ID
        state.selectedConnectionId = undefined;
      });
    },

    startEditingConnectionEndpoint: (connectionId: string, endpoint: 'start' | 'end') => {
      set((state) => {
        // First, auto-save and stop any node editing to prevent conflicts
        const editingNodes = state.nodes.filter(node => node.isEditing);
        if (editingNodes.length > 0) {
          console.log('🔧 Store: Auto-saving editing nodes before connection editing:', editingNodes.map(n => n.id));
          editingNodes.forEach(node => {
            // Auto-save the current editing text and stop editing
            node.isEditing = false;
          });
        }
        
        // Store original connection state for potential revert
        const connection = state.connections.find(c => c.id === connectionId);
        if (connection) {
          state.canvas.originalConnectionState = {
            from: connection.from,
            to: connection.to,
            fromSide: connection.fromSide,
            toSide: connection.toSide
          };
        }
        
        // Now start connection editing
        state.canvas.isEditingConnection = true;
        state.canvas.editingConnectionId = connectionId;
        state.canvas.editingEndpoint = endpoint;
        
        // Initialize preview position to current endpoint position for immediate visual feedback
        if (connection) {
          const editingNode = endpoint === 'start' ? 
            state.nodes.find(n => n.id === connection.from) : 
            state.nodes.find(n => n.id === connection.to);
          
          if (editingNode) {
            // Set initial preview position to center of the node being edited
            state.canvas.editingPreviewPosition = {
              x: editingNode.position.x + editingNode.size.width / 2,
              y: editingNode.position.y + editingNode.size.height / 2
            };
          } else {
            state.canvas.editingPreviewPosition = { x: 0, y: 0 };
          }
        } else {
          state.canvas.editingPreviewPosition = { x: 0, y: 0 };
        }
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
          
          // Update the appropriate endpoint and recalculate connection sides
          const fromNode = state.nodes.find(n => n.id === connection.from);
          const toNode = state.nodes.find(n => n.id === connection.to);
          let newFromNode = fromNode;
          let newToNode = toNode;
          
          if (endpoint === 'start') {
            connection.from = newNodeId;
            newFromNode = state.nodes.find(n => n.id === newNodeId);
            console.log('🔧 Store: Updated start endpoint to:', newNodeId);
          } else {
            connection.to = newNodeId;
            newToNode = state.nodes.find(n => n.id === newNodeId);
            console.log('🔧 Store: Updated end endpoint to:', newNodeId);
          }
          
          // Recalculate connection sides for the new connection
          if (newFromNode && newToNode) {
            const sides = determineConnectionSides(newFromNode, newToNode);
            connection.fromSide = sides.fromSide;
            connection.toSide = sides.toSide;
            console.log('🔧 Store: Updated connection sides:', sides);
          }
          
          console.log('🔧 Store: After update - connection.from:', connection.from, 'connection.to:', connection.to);
          
          // Update present state AFTER making changes
          state.history.present = {
            nodes: [...state.nodes],
            connections: [...state.connections],
          };
          
          // Clear editing state and original state
          state.canvas.isEditingConnection = false;
          state.canvas.editingConnectionId = undefined;
          state.canvas.editingEndpoint = undefined;
          state.canvas.editingPreviewPosition = undefined;
          state.canvas.originalConnectionState = undefined;
          
          // Also clear any connection creation state to prevent interference
          state.canvas.isConnecting = false;
          state.canvas.connectionStartPoint = undefined;
          state.canvas.connectionStartPosition = undefined;
          state.canvas.connectionEndPosition = undefined;
          
          console.log('🔧 Store: Editing state cleared');
        } else {
          console.log('🔧 Store: No connection or endpoint found - no update performed');
        }
      });
    },

    cancelConnectionEndpointEdit: () => {
      set((state) => {
        // If we have original state, revert the connection to its original state
        if (state.canvas.originalConnectionState && state.canvas.editingConnectionId) {
          const connection = state.connections.find(c => c.id === state.canvas.editingConnectionId);
          if (connection) {
            console.log('🔄 Store: Reverting connection to original state');
            connection.from = state.canvas.originalConnectionState.from;
            connection.to = state.canvas.originalConnectionState.to;
            connection.fromSide = state.canvas.originalConnectionState.fromSide;
            connection.toSide = state.canvas.originalConnectionState.toSide;
          }
        }
        
        // Clear all editing state
        state.canvas.isEditingConnection = false;
        state.canvas.editingConnectionId = undefined;
        state.canvas.editingEndpoint = undefined;
        state.canvas.editingPreviewPosition = undefined;
        state.canvas.originalConnectionState = undefined;
        
        // Also clear any connection creation state to prevent interference
        state.canvas.isConnecting = false;
        state.canvas.connectionStartPoint = undefined;
        state.canvas.connectionStartPosition = undefined;
        state.canvas.connectionEndPosition = undefined;
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
    
    // Connection Point Actions
    setHoveredConnectionPoint: (pointId: string | undefined) => {
      set((state) => {
        state.canvas.hoveredConnectionPoint = pointId;
      });
    },
    
    setActiveConnectionPoint: (pointId: string | undefined) => {
      set((state) => {
        state.canvas.activeConnectionPoint = pointId;
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
        state.canvas.activeConnectionPoint = connectionPointId;
      });
    },

    updateConnectionPreview: (endPosition: Position) => {
      set((state) => {
        if (state.canvas.isConnecting) {
          state.canvas.connectionEndPosition = endPosition;
        }
      });
    },

    updateEditingPreview: (mousePosition: Position) => {
      set((state) => {
        if (state.canvas.isEditingConnection) {
          state.canvas.editingPreviewPosition = mousePosition;
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
                // Find the nodes to determine connection sides
                const fromNode = state.nodes.find(n => n.id === fromNodeId);
                const toNode = state.nodes.find(n => n.id === toNodeId);
                
                let fromSide, toSide;
                if (fromNode && toNode) {
                  const sides = determineConnectionSides(fromNode, toNode);
                  fromSide = sides.fromSide;
                  toSide = sides.toSide;
                }
                
                const newConnection = {
                  id: uuidv4(),
                  from: fromNodeId,
                  to: toNodeId,
                  fromSide,
                  toSide,
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
        
        // Reset connection state (cancellation or completion)
        state.canvas.isConnecting = false;
        state.canvas.connectionStartPoint = undefined;
        state.canvas.connectionStartPosition = undefined;
        state.canvas.connectionEndPosition = undefined;
        state.canvas.activeConnectionPoint = undefined;
        state.canvas.hoveredConnectionPoint = undefined;
      });
    },

    // Cancel connection creation (new method)
    cancelConnectionCreation: () => {
      set((state) => {
        console.log('🔄 Store: Canceling connection creation');
        // Simply clear connection creation state without creating a connection
        state.canvas.isConnecting = false;
        state.canvas.connectionStartPoint = undefined;
        state.canvas.connectionStartPosition = undefined;
        state.canvas.activeConnectionPoint = undefined;
        state.canvas.hoveredConnectionPoint = undefined;
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