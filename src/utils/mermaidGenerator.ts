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
    if (this.nodes.length === 0) {
      return 'flowchart TD\n    start([Click New Node to add your first idea!])';
    }

    if (this.nodes.length === 1) {
      const node = this.nodes[0];
      const nodeId = this.getNodeId(node.id);
      return `flowchart TD\n    ${nodeId}[${this.cleanText(node.text)}]`;
    }

    let code = 'flowchart TD\n';
    
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
      return 'mindmap\n  root\n    Click "New Node" to add your first idea!';
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
      return 'mindmap\n  root\n    Click "New Node" to add your first idea!';
    }

    let code = 'mindmap\n  root\n';
    this.nodes.forEach(node => {
      code += `    ${this.cleanText(node.text)}\n`;
    });
    return code;
  }

  /**
   * Get structure analysis for debugging
   */
  getAnalysis() {
    const rootNode = this.findRootNode();
    const hierarchy = this.buildHierarchy(rootNode);
    
    return {
      totalNodes: this.nodes.length,
      totalConnections: this.connections.length,
      rootNode: rootNode.text,
      maxDepth: this.calculateMaxDepth(hierarchy),
      structure: hierarchy
    };
  }

  private calculateMaxDepth(node: MindmapNode): number {
    if (node.children.length === 0) return node.level;
    return Math.max(...node.children.map(child => this.calculateMaxDepth(child)));
  }
}