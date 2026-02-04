// Calculate distance between two lat/lng coordinates using Haversine formula
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Return distance in meters
}

// Create a proper grid of nodes for pathfinding
export function createMapGrid(center, gridSize = 25) {
  const nodes = [];
  const latSpacing = 0.002; // Approximately 220 meters
  const lngSpacing = 0.003; // Approximately 220 meters
  
  const halfSize = Math.floor(gridSize / 2);
  
  for (let row = 0; row < gridSize; row++) {
    const currentRow = [];
    for (let col = 0; col < gridSize; col++) {
      const lat = center[0] + (row - halfSize) * latSpacing;
      const lng = center[1] + (col - halfSize) * lngSpacing;
      
      const node = {
        id: `${row}-${col}`,
        row,
        col,
        lat,
        lng,
        distance: Infinity,
        isVisited: false,
        isWall: false,
        previousNode: null,
        isStart: false,
        isFinish: false
      };
      
      currentRow.push(node);
    }
    nodes.push(currentRow);
  }
  
  return nodes;
}

// Get neighbors in grid (up, down, left, right)
function getNeighbors(node, grid) {
  const neighbors = [];
  const { row, col } = node;
  
  // Up
  if (row > 0) neighbors.push(grid[row - 1][col]);
  // Down
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  // Left
  if (col > 0) neighbors.push(grid[row][col - 1]);
  // Right
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  
  return neighbors.filter(neighbor => !neighbor.isVisited);
}

// Dijkstra's algorithm adapted for 2D grid
export function dijkstra(grid, startNode, finishNode) {
  const visitedNodesInOrder = [];
  
  // Reset all nodes
  for (const row of grid) {
    for (const node of row) {
      node.distance = Infinity;
      node.isVisited = false;
      node.previousNode = null;
    }
  }
  
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);
  
  while (unvisitedNodes.length > 0) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift();
    
    // Skip walls
    if (closestNode.isWall) continue;
    
    // If trapped, stop
    if (closestNode.distance === Infinity) {
      return visitedNodesInOrder;
    }
    
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    
    // Found target
    if (closestNode.id === finishNode.id) {
      return visitedNodesInOrder;
    }
    
    updateUnvisitedNeighbors(closestNode, grid);
  }
  
  return visitedNodesInOrder;
}

function sortNodesByDistance(unvisitedNodes) {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

function updateUnvisitedNeighbors(node, grid) {
  const unvisitedNeighbors = getNeighbors(node, grid);
  
  for (const neighbor of unvisitedNeighbors) {
    // Calculate actual distance between nodes
    const distance = getDistance(node.lat, node.lng, neighbor.lat, neighbor.lng);
    const newDistance = node.distance + distance;
    
    if (newDistance < neighbor.distance) {
      neighbor.distance = newDistance;
      neighbor.previousNode = node;
    }
  }
}

function getAllNodes(grid) {
  const nodes = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
}

// Get shortest path by backtracking
export function getNodesInShortestPathOrder(finishNode) {
  const nodesInShortestPathOrder = [];
  let currentNode = finishNode;
  
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  
  return nodesInShortestPathOrder;
}
