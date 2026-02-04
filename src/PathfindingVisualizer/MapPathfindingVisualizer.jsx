import React, { Component } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, useMapEvents } from 'react-leaflet';
import { dijkstra, getNodesInShortestPathOrder, createMapGrid } from '../algorithms/dijkstra';
import 'leaflet/dist/leaflet.css';
import './MapPathfindingVisualizer.css';

// New York City coordinates
const DEFAULT_CENTER = [40.7128, -74.0060];
const DEFAULT_ZOOM = 14;
const GRID_SIZE = 25;

// Map click handler component
function MapClickHandler({ onClick, mode }) {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick(e.latlng);
      }
    },
  });
  return null;
}

export default class MapPathfindingVisualizer extends Component {
  constructor() {
    super();
    this.state = {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      grid: [],
      startNode: null,
      finishNode: null,
      visitedNodes: [],
      shortestPath: [],
      isVisualizing: false,
      mode: 'setStart', // 'setStart', 'setFinish', 'setWall', 'ready'
    };
  }

  componentDidMount() {
    this.initializeGrid();
  }

  initializeGrid = () => {
    const grid = createMapGrid(DEFAULT_CENTER, GRID_SIZE);
    
    // Set default start and finish nodes
    const middleRow = Math.floor(GRID_SIZE / 2);
    const startNode = grid[middleRow][Math.floor(GRID_SIZE * 0.3)];
    const finishNode = grid[middleRow][Math.floor(GRID_SIZE * 0.7)];
    
    startNode.isStart = true;
    finishNode.isFinish = true;
    
    this.setState({
      grid,
      startNode,
      finishNode,
      mode: 'setWall',
      visitedNodes: [],
      shortestPath: []
    });
  };

  findClosestNode = (latlng) => {
    const { grid } = this.state;
    let closestNode = null;
    let minDistance = Infinity;
    
    for (const row of grid) {
      for (const node of row) {
        const distance = Math.sqrt(
          Math.pow(node.lat - latlng.lat, 2) + 
          Math.pow(node.lng - latlng.lng, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestNode = node;
        }
      }
    }
    
    return closestNode;
  };

  handleMapClick = (latlng) => {
    const { mode, grid, startNode, finishNode, isVisualizing } = this.state;
    
    if (isVisualizing) return;
    
    const clickedNode = this.findClosestNode(latlng);
    if (!clickedNode) return;
    
    // Clear previous node states
    if (mode === 'setStart' && startNode) {
      startNode.isStart = false;
    }
    if (mode === 'setFinish' && finishNode) {
      finishNode.isFinish = false;
    }
    
    if (mode === 'setStart') {
      clickedNode.isStart = true;
      clickedNode.isWall = false;
      this.setState({ 
        startNode: clickedNode, 
        mode: 'setFinish',
        grid: [...grid]
      });
    } else if (mode === 'setFinish') {
      clickedNode.isFinish = true;
      clickedNode.isWall = false;
      this.setState({ 
        finishNode: clickedNode, 
        mode: 'setWall',
        grid: [...grid]
      });
    } else if (mode === 'setWall') {
      // Don't allow walls on start or finish
      if (!clickedNode.isStart && !clickedNode.isFinish) {
        clickedNode.isWall = !clickedNode.isWall;
        this.setState({ grid: [...grid] });
      }
    }
  };

  visualizeDijkstra = () => {
    const { grid, startNode, finishNode } = this.state;
    
    if (!startNode || !finishNode) {
      alert('Please set start and finish points!');
      return;
    }
    
    this.setState({ 
      isVisualizing: true, 
      visitedNodes: [], 
      shortestPath: [] 
    });
    
    // Run the algorithm
    const visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
    const shortestPathNodes = getNodesInShortestPathOrder(finishNode);
    
    // Animate
    this.animateAlgorithm(visitedNodesInOrder, shortestPathNodes);
  };

  animateAlgorithm = (visitedNodesInOrder, shortestPathNodes) => {
    const animationSpeed = 30; // milliseconds per node
    
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          this.setState({ 
            shortestPath: shortestPathNodes, 
            isVisualizing: false 
          });
        }, animationSpeed * i);
        return;
      }
      
      setTimeout(() => {
        const newVisited = visitedNodesInOrder.slice(0, i + 1);
        this.setState({ visitedNodes: newVisited });
      }, animationSpeed * i);
    }
  };

  clearPath = () => {
    const { grid } = this.state;
    
    // Reset visited and path states
    for (const row of grid) {
      for (const node of row) {
        node.distance = Infinity;
        node.isVisited = false;
        node.previousNode = null;
      }
    }
    
    this.setState({
      visitedNodes: [],
      shortestPath: [],
      isVisualizing: false
    });
  };

  clearAll = () => {
    this.initializeGrid();
  };

  setMode = (newMode) => {
    if (!this.state.isVisualizing) {
      this.setState({ mode: newMode });
    }
  };

  getNodeColor = (node) => {
    const { startNode, finishNode, visitedNodes, shortestPath } = this.state;
    
    if (node.id === startNode?.id) return '#10B981'; // Green
    if (node.id === finishNode?.id) return '#EF4444'; // Red
    if (shortestPath.find(n => n.id === node.id)) return '#FBBF24'; // Yellow
    if (visitedNodes.find(n => n.id === node.id)) return '#3B82F6'; // Blue
    if (node.isWall) return '#1F2937'; // Dark gray
    return '#9CA3AF'; // Light gray
  };

  getNodeRadius = (node) => {
    const { startNode, finishNode, shortestPath } = this.state;
    
    if (node.id === startNode?.id || node.id === finishNode?.id) return 10;
    if (shortestPath.find(n => n.id === node.id)) return 7;
    if (node.isWall) return 6;
    return 4;
  };

  render() {
    const { center, zoom, grid, mode, isVisualizing, shortestPath, startNode, finishNode } = this.state;

    return (
      <div className="map-visualizer">
        <div className="navbar">
          <div className="navbar-brand">
            <h1>🗺️ Map Pathfinding Visualizer</h1>
          </div>
          
          <div className="navbar-controls">
            <div className="mode-buttons">
              <button 
                className={`btn ${mode === 'setStart' ? 'btn-active' : 'btn-secondary'}`}
                onClick={() => this.setMode('setStart')}
                disabled={isVisualizing}>
                📍 Set Start
              </button>
              <button 
                className={`btn ${mode === 'setFinish' ? 'btn-active' : 'btn-secondary'}`}
                onClick={() => this.setMode('setFinish')}
                disabled={isVisualizing}>
                🎯 Set Finish
              </button>
              <button 
                className={`btn ${mode === 'setWall' ? 'btn-active' : 'btn-secondary'}`}
                onClick={() => this.setMode('setWall')}
                disabled={isVisualizing}>
                🧱 Toggle Walls
              </button>
            </div>
            
            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={this.visualizeDijkstra}
                disabled={isVisualizing}>
                ▶️ Visualize Dijkstra
              </button>
              <button 
                className="btn btn-secondary"
                onClick={this.clearPath}
                disabled={isVisualizing}>
                🔄 Clear Path
              </button>
              <button 
                className="btn btn-secondary"
                onClick={this.clearAll}
                disabled={isVisualizing}>
                🗑️ Clear All
              </button>
            </div>
          </div>
        </div>

        <div className="instructions">
          <div className="legend">
            <div className="legend-item">
              <div className="legend-dot" style={{backgroundColor: '#10B981'}}></div>
              <span>Start Point</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{backgroundColor: '#EF4444'}}></div>
              <span>Finish Point</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{backgroundColor: '#1F2937'}}></div>
              <span>Wall</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{backgroundColor: '#3B82F6'}}></div>
              <span>Visited</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{backgroundColor: '#FBBF24'}}></div>
              <span>Shortest Path</span>
            </div>
          </div>
          <p className="hint">
            Current Mode: <strong>
              {mode === 'setStart' ? 'Click map to set START point' : 
               mode === 'setFinish' ? 'Click map to set FINISH point' : 
               'Click points to toggle WALLS'}
            </strong>
          </p>
        </div>

        <MapContainer
          center={center}
          zoom={zoom}
          className="map-container"
          zoomControl={true}
          scrollWheelZoom={true}>
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onClick={this.handleMapClick} mode={mode} />

          {/* Render all grid nodes */}
          {grid.flat().map(node => (
            <CircleMarker
              key={node.id}
              center={[node.lat, node.lng]}
              radius={this.getNodeRadius(node)}
              fillColor={this.getNodeColor(node)}
              color="#ffffff"
              weight={1}
              opacity={0.9}
              fillOpacity={0.8}
            />
          ))}

          {/* Draw shortest path line */}
          {shortestPath.length > 1 && (
            <Polyline
              positions={shortestPath.map(node => [node.lat, node.lng])}
              color="#FBBF24"
              weight={5}
              opacity={0.9}
            />
          )}
        </MapContainer>
      </div>
    );
  }
}
