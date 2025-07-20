import type { Node, Position } from '../types';

export type ConnectionSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Calculate the position of a connection point on a specific side of a node
 */
export function getConnectionPointPosition(node: Node, side: ConnectionSide): Position {
  const { position, size } = node;
  
  switch (side) {
    case 'top':
      return {
        x: position.x + size.width / 2,
        y: position.y
      };
    case 'right':
      return {
        x: position.x + size.width,
        y: position.y + size.height / 2
      };
    case 'bottom':
      return {
        x: position.x + size.width / 2,
        y: position.y + size.height
      };
    case 'left':
      return {
        x: position.x,
        y: position.y + size.height / 2
      };
  }
}

/**
 * Determine the best connection side based on the relative position of two nodes
 */
export function determineConnectionSides(fromNode: Node, toNode: Node): {
  fromSide: ConnectionSide;
  toSide: ConnectionSide;
} {
  const fromCenter = {
    x: fromNode.position.x + fromNode.size.width / 2,
    y: fromNode.position.y + fromNode.size.height / 2
  };
  
  const toCenter = {
    x: toNode.position.x + toNode.size.width / 2,
    y: toNode.position.y + toNode.size.height / 2
  };
  
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  
  // Determine primary direction
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  
  let fromSide: ConnectionSide;
  let toSide: ConnectionSide;
  
  if (absX > absY) {
    // Horizontal connection is dominant
    if (dx > 0) {
      // Target is to the right
      fromSide = 'right';
      toSide = 'left';
    } else {
      // Target is to the left
      fromSide = 'left';
      toSide = 'right';
    }
  } else {
    // Vertical connection is dominant
    if (dy > 0) {
      // Target is below
      fromSide = 'bottom';
      toSide = 'top';
    } else {
      // Target is above
      fromSide = 'top';
      toSide = 'bottom';
    }
  }
  
  return { fromSide, toSide };
}

/**
 * Get all connection points for a node
 */
export function getNodeConnectionPoints(node: Node): Array<{
  side: ConnectionSide;
  position: Position;
}> {
  return [
    { side: 'top', position: getConnectionPointPosition(node, 'top') },
    { side: 'right', position: getConnectionPointPosition(node, 'right') },
    { side: 'bottom', position: getConnectionPointPosition(node, 'bottom') },
    { side: 'left', position: getConnectionPointPosition(node, 'left') }
  ];
}

/**
 * Find the closest connection side to a given position
 */
export function findClosestConnectionSide(node: Node, targetPosition: Position): ConnectionSide {
  const connectionPoints = getNodeConnectionPoints(node);
  
  let closestSide: ConnectionSide = 'right';
  let minDistance = Infinity;
  
  for (const point of connectionPoints) {
    const distance = Math.sqrt(
      Math.pow(point.position.x - targetPosition.x, 2) +
      Math.pow(point.position.y - targetPosition.y, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestSide = point.side;
    }
  }
  
  return closestSide;
}