import type { Node, Connection } from '../types';

interface MindmapNode {
  id: string;
  text: string;
  children: MindmapNode[];
  level: number;
}

export class MermaidGenerator {
  private nodes: Node[];
  private connections: Connection[];

  constructor(nodes: Node[], connections: Connection[]) {
    this.nodes = nodes;
    this.connections = connections;
  }

  /**
   * Generate complete Mermaid flowchart code with logical relationships
   */
  generateFlowchartCode(): string {
    return this.generateFlowchartCodeInternal(false);
  }

  /**
   * Generate structured Mermaid flowchart code optimized for LLM analysis
   */
  generateStructuredFlowchartCode(): string {
    return this.generateFlowchartCodeInternal(true);
  }

  /**
   * Internal method to generate flowchart code with optional structuring
   */
  private generateFlowchartCodeInternal(structured: boolean): string {
    const header = `%% 本図は「事象間の論理関係」を示すための**簡易ラベル集**です。
%% 矢印は「因果・階層・並列」の三軸に整理し、流れは矢印の向きで示します。具体的な関係は直感的に読める8ラベルのみを採用しています。
%% 1. 因果（前->後）
%% - 原因 : ある事象を引き起こすトリガーを示す
%% - 結果 : 原因や手段から生じるアウトカムを示す
%%
%% 2. 目的-手段ブリッジ
%% - 手段 : 目標や結果を達成するための具体的アプローチを示す
%%
%% 3. 階層（抽象<->具体）
%% - 具体例 : 抽象概念に対する具体的なサンプルを示す
%% - 要素 : 上位概念を分解して下位項目を示す
%%
%% 4. 並列（横の関係）
%% - 同類 : 同一カテゴリー・同格の要素同士をつなぐ
%% - 対比 : 性質が対照的／競合的な要素を比較する
%% - 補完 : 片方でも機能するが、相乗効果がある要素を示す
%%
`;

    if (this.nodes.length === 0) {
      return header + 'flowchart TD\n    start([Click Add Node to add your first idea!])';
    }

    if (this.nodes.length === 1) {
      const node = this.nodes[0];
      const nodeId = this.getNodeId(node.id);
      return header + `flowchart TD\n    ${nodeId}[${this.cleanText(node.text)}]`;
    }

    if (structured && this.connections.length > 0) {
      return this.generateStructuredCode(header);
    }

    // Default flat structure
    let code = header + 'flowchart TD\n';
    
    // Add all nodes
    this.nodes.forEach(node => {
      const nodeId = this.getNodeId(node.id);
      const nodeText = this.cleanText(node.text);
      code += `    ${nodeId}[${nodeText}]\n`;
    });

    // Add connections with labels
    if (this.connections.length > 0) {
      code += '\n';
      this.connections.forEach(connection => {
        const fromId = this.getNodeId(connection.from);
        const toId = this.getNodeId(connection.to);
        
        if (connection.label) {
          code += `    ${fromId} -->|${connection.label}| ${toId}\n`;
        } else {
          code += `    ${fromId} --> ${toId}\n`;
        }
      });
    }

    return code;
  }

  /**
   * Generate complete Mermaid mindmap code with hierarchical structure (legacy)
   */
  generateMindmapCode(): string {
    if (this.nodes.length === 0) {
      return 'mindmap\n  root\n    Click "Add Node" to add your first idea!';
    }

    if (this.nodes.length === 1) {
      const node = this.nodes[0];
      return `mindmap\n  root\n    ${this.cleanText(node.text)}`;
    }

    // Build hierarchical structure
    const rootNode = this.findRootNode();
    const hierarchy = this.buildHierarchy(rootNode);
    
    // Generate Mermaid code
    return this.generateMermaidFromHierarchy(hierarchy);
  }

  /**
   * Find the root node (node with most connections or first created)
   */
  private findRootNode(): Node {
    if (this.connections.length === 0) {
      // No connections - return first node
      return this.nodes[0];
    }

    // Count connections for each node
    const connectionCounts = new Map<string, number>();
    this.nodes.forEach(node => connectionCounts.set(node.id, 0));

    this.connections.forEach(connection => {
      connectionCounts.set(connection.from, (connectionCounts.get(connection.from) || 0) + 1);
      connectionCounts.set(connection.to, (connectionCounts.get(connection.to) || 0) + 1);
    });

    // Find node with most connections
    let rootNode = this.nodes[0];
    let maxConnections = 0;

    for (const [nodeId, count] of connectionCounts) {
      if (count > maxConnections) {
        maxConnections = count;
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) rootNode = node;
      }
    }

    return rootNode;
  }

  /**
   * Build hierarchical structure starting from root
   */
  private buildHierarchy(rootNode: Node): MindmapNode {
    const visited = new Set<string>();
    
    const buildNode = (node: Node, level: number): MindmapNode => {
      visited.add(node.id);
      
      const mindmapNode: MindmapNode = {
        id: node.id,
        text: node.text,
        children: [],
        level
      };

      // Find connected nodes
      const connectedNodeIds = this.connections
        .filter(conn => 
          (conn.from === node.id || conn.to === node.id) && 
          !visited.has(conn.from === node.id ? conn.to : conn.from)
        )
        .map(conn => conn.from === node.id ? conn.to : conn.from);

      // Recursively build children
      connectedNodeIds.forEach(nodeId => {
        const childNode = this.nodes.find(n => n.id === nodeId);
        if (childNode && !visited.has(nodeId)) {
          mindmapNode.children.push(buildNode(childNode, level + 1));
        }
      });

      return mindmapNode;
    };

    const hierarchy = buildNode(rootNode, 0);
    
    // Add any unconnected nodes as top-level children
    const unconnectedNodes = this.nodes.filter(node => !visited.has(node.id));
    unconnectedNodes.forEach(node => {
      hierarchy.children.push({
        id: node.id,
        text: node.text,
        children: [],
        level: 1
      });
    });

    return hierarchy;
  }

  /**
   * Generate Mermaid code from hierarchical structure
   */
  private generateMermaidFromHierarchy(hierarchy: MindmapNode): string {
    let code = 'mindmap\n';
    
    // Root node
    code += `  root((${this.cleanText(hierarchy.text)}))\n`;
    
    // Generate children recursively
    const generateChildren = (node: MindmapNode, indent: string) => {
      node.children.forEach(child => {
        code += `${indent}${this.cleanText(child.text)}\n`;
        if (child.children.length > 0) {
          generateChildren(child, indent + '  ');
        }
      });
    };

    generateChildren(hierarchy, '    ');
    
    return code;
  }

  /**
   * Generate short node ID from UUID for Mermaid
   */
  private getNodeId(uuid: string): string {
    // Use first 8 characters of UUID for readable node IDs
    return 'node_' + uuid.substring(0, 8);
  }

  /**
   * Clean text for Mermaid compatibility
   */
  private cleanText(text: string): string {
    return text
      .replace(/\n/g, ' ')
      .replace(/[()[\]]/g, '')
      .trim() || 'Empty Node';
  }

  /**
   * Generate simple flat structure (fallback)
   */
  generateSimpleCode(): string {
    if (this.nodes.length === 0) {
      return 'mindmap\n  root\n    Click "Add Node" to add your first idea!';
    }

    let code = 'mindmap\n  root\n';
    this.nodes.forEach(node => {
      code += `    ${this.cleanText(node.text)}\n`;
    });
    return code;
  }

  /**
   * Generate structured Mermaid code optimized for LLM analysis
   * Finds the longest chain and organizes other nodes as branches
   */
  private generateStructuredCode(header: string): string {
    // Find the main chain in the graph using semantic analysis
    const mainChain = this.findMainChain();
    
    if (mainChain.length === 0) {
      // Fallback to flat structure if no path found
      return this.generateFlowchartCodeInternal(false);
    }

    let code = header + 'flowchart TD\n';
    
    // Build the main chain first
    const pathNodeIds = new Set(mainChain.map(node => node.id));
    
    // Add main chain nodes
    mainChain.forEach(node => {
      const nodeId = this.getNodeId(node.id);
      const nodeText = this.cleanText(node.text);
      code += `    ${nodeId}[${nodeText}]  %% Main Chain\n`;
    });
    
    // Add main chain connections
    for (let i = 0; i < mainChain.length - 1; i++) {
      const fromId = this.getNodeId(mainChain[i].id);
      const toId = this.getNodeId(mainChain[i + 1].id);
      
      // Find the connection between these nodes to get the label
      const connection = this.connections.find(conn => 
        (conn.from === mainChain[i].id && conn.to === mainChain[i + 1].id) ||
        (conn.from === mainChain[i + 1].id && conn.to === mainChain[i].id)
      );
      
      if (connection && connection.label) {
        code += `    ${fromId} -->|${connection.label}| ${toId}  %% Main Flow\n`;
      } else {
        code += `    ${fromId} --> ${toId}  %% Main Flow\n`;
      }
    }
    
    code += '\n    %% Branch Nodes\n';
    
    // Add branch nodes (nodes not in main chain)
    const branchNodes = this.nodes.filter(node => !pathNodeIds.has(node.id));
    branchNodes.forEach(node => {
      const nodeId = this.getNodeId(node.id);
      const nodeText = this.cleanText(node.text);
      code += `    ${nodeId}[${nodeText}]  %% Branch\n`;
    });
    
    if (branchNodes.length > 0) {
      code += '\n    %% Branch Connections\n';
    }
    
    // Add branch connections (connections involving branch nodes)
    this.connections.forEach(connection => {
      const fromInPath = pathNodeIds.has(connection.from);
      const toInPath = pathNodeIds.has(connection.to);
      
      // Skip connections that are already part of the main chain
      const isMainChainConnection = fromInPath && toInPath && 
        this.isConsecutiveInPath(connection.from, connection.to, mainChain);
      
      if (!isMainChainConnection) {
        const fromId = this.getNodeId(connection.from);
        const toId = this.getNodeId(connection.to);
        
        const comment = fromInPath || toInPath ? ' %% Branch Connection' : ' %% Sub-branch';
        
        if (connection.label) {
          code += `    ${fromId} -->|${connection.label}| ${toId}${comment}\n`;
        } else {
          code += `    ${fromId} --> ${toId}${comment}\n`;
        }
      }
    });
    
    return code;
  }

  /**
   * Find the main chain in the connection graph using semantic analysis
   */
  private findMainChain(): Node[] {
    if (this.nodes.length === 0) return [];
    if (this.connections.length === 0) return [this.nodes[0]];
    
    // 1. Try semantic analysis first (number-based sequencing)
    const semanticChain = this.findSemanticMainChain();
    if (semanticChain.length > 1) {
      console.log('🧠 LLM: Using semantic main chain:', semanticChain.map(n => n.text));
      return semanticChain;
    }
    
    // 2. Fallback to traditional longest path if semantic analysis fails
    console.log('🧠 LLM: Semantic analysis failed, using longest path fallback');
    return this.findLongestPathFallback();
  }

  /**
   * Find main chain using semantic analysis (number-based sequencing)
   */
  private findSemanticMainChain(): Node[] {
    // Extract numbers from node texts and create numbered nodes
    const numberedNodes = this.nodes
      .map(node => ({ node, number: this.extractNumber(node.text) }))
      .filter((item): item is { node: Node; number: number } => item.number !== null)
      .sort((a, b) => a.number - b.number);
    
    console.log('🧠 LLM: Numbered nodes:', numberedNodes.map(n => ({ text: n.node.text, number: n.number })));
    
    if (numberedNodes.length < 2) {
      return []; // Not enough numbered nodes for semantic analysis
    }
    
    // Find the longest consecutive sequence
    return this.findConsecutiveChain(numberedNodes);
  }

  /**
   * Extract number from node text for semantic analysis
   */
  private extractNumber(text: string): number | null {
    // Match patterns like "1", "2", "3", etc. at the beginning
    const match = text.match(/^(\d+)(?:\D|$)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Find consecutive chain from numbered nodes
   */
  private findConsecutiveChain(numberedNodes: Array<{node: Node, number: number}>): Node[] {
    let longestChain: Node[] = [];
    let currentChain: Node[] = [];
    
    for (let i = 0; i < numberedNodes.length; i++) {
      const current = numberedNodes[i];
      
      // Check if this node is connected to form a valid chain
      if (currentChain.length === 0) {
        currentChain = [current.node];
      } else {
        const lastNode = currentChain[currentChain.length - 1];
        const isConnected = this.areNodesConnected(lastNode, current.node);
        const isConsecutive = current.number === ((numberedNodes[i-1]?.number ?? 0) + 1);
        
        if (isConnected && isConsecutive) {
          currentChain.push(current.node);
        } else {
          // Chain broken, check if current chain is longest
          if (currentChain.length > longestChain.length) {
            longestChain = [...currentChain];
          }
          currentChain = [current.node];
        }
      }
    }
    
    // Check final chain
    if (currentChain.length > longestChain.length) {
      longestChain = [...currentChain];
    }
    
    console.log('🧠 LLM: Found consecutive chain:', longestChain.map(n => n.text));
    return longestChain;
  }

  /**
   * Check if two nodes are directly connected
   */
  private areNodesConnected(node1: Node, node2: Node): boolean {
    return this.connections.some(conn => 
      (conn.from === node1.id && conn.to === node2.id) ||
      (conn.from === node2.id && conn.to === node1.id)
    );
  }

  /**
   * Fallback to traditional longest path algorithm
   */
  private findLongestPathFallback(): Node[] {
    let longestPath: Node[] = [];
    
    // Try starting from each node to find the longest path
    for (const startNode of this.nodes) {
      const path = this.findLongestPathFromNode(startNode, new Set());
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    }
    
    return longestPath;
  }

  /**
   * Find the longest path starting from a specific node using DFS
   */
  private findLongestPathFromNode(startNode: Node, visited: Set<string>): Node[] {
    visited.add(startNode.id);
    
    // Find all connected nodes that haven't been visited
    const connectedNodeIds = this.connections
      .filter(conn => 
        (conn.from === startNode.id || conn.to === startNode.id) && 
        !visited.has(conn.from === startNode.id ? conn.to : conn.from)
      )
      .map(conn => conn.from === startNode.id ? conn.to : conn.from);
    
    if (connectedNodeIds.length === 0) {
      visited.delete(startNode.id);
      return [startNode];
    }
    
    let longestSubPath: Node[] = [];
    
    // Try each connected node recursively
    for (const nodeId of connectedNodeIds) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        const subPath = this.findLongestPathFromNode(node, visited);
        if (subPath.length > longestSubPath.length) {
          longestSubPath = subPath;
        }
      }
    }
    
    visited.delete(startNode.id);
    return [startNode, ...longestSubPath];
  }

  /**
   * Check if two nodes are consecutive in the given path
   */
  private isConsecutiveInPath(nodeId1: string, nodeId2: string, path: Node[]): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i].id === nodeId1 && path[i + 1].id === nodeId2) ||
          (path[i].id === nodeId2 && path[i + 1].id === nodeId1)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get structure analysis for debugging
   */
  getAnalysis() {
    const rootNode = this.findRootNode();
    const hierarchy = this.buildHierarchy(rootNode);
    const mainChain = this.findMainChain();
    
    return {
      totalNodes: this.nodes.length,
      totalConnections: this.connections.length,
      rootNode: rootNode.text,
      maxDepth: this.calculateMaxDepth(hierarchy),
      mainChainLength: mainChain.length,
      mainChain: mainChain.map(node => node.text),
      structure: hierarchy
    };
  }

  private calculateMaxDepth(node: MindmapNode): number {
    if (node.children.length === 0) return node.level;
    return Math.max(...node.children.map(child => this.calculateMaxDepth(child)));
  }
}