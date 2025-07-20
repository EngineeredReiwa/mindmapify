import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { Canvas } from './components/Canvas/Canvas';
import { Toolbar } from './components/Toolbar/Toolbar';
import { useNodes, useConnections, useMindmapStore } from './stores/mindmapStore';
import { MermaidGenerator } from './utils/mermaidGenerator';

function App() {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [copySuccess, setCopySuccess] = useState(false);
  const nodes = useNodes();
  const connections = useConnections();

  // Expose store to window for debugging
  useEffect(() => {
    (window as any).mindmapStore = useMindmapStore;
  }, []);

  // Handle window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const sidebar = document.querySelector('.sidebar');
      const header = document.querySelector('.header');
      const sidebarWidth = sidebar?.clientWidth || 300;
      const headerHeight = header?.clientHeight || 50;
      
      setCanvasSize({
        width: window.innerWidth - sidebarWidth,
        height: window.innerHeight - headerHeight,
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Handle canvas click - now only for selection, not adding nodes
  const handleCanvasClick = () => {
    // Future: Add selection logic here
    // For now, do nothing - nodes are added via toolbar
  };

  // Generate advanced Mermaid Flowchart code with logical relationships (memoized for performance)
  const mermaidCode = useMemo(() => {
    const generator = new MermaidGenerator(nodes, connections);
    return generator.generateFlowchartCode();
  }, [nodes, connections]);

  // Handle copy to clipboard with feedback
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Hide success message after 2 seconds
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = mermaidCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>🧠 Mindmapify</h1>
          <p>Think freely. Export clearly.</p>
        </div>
        <div className="header-center">
          <Toolbar />
        </div>
        <div className="header-right">
          <span>Nodes: {nodes.length}</span>
          {connections.length > 0 && <span>• Connections: {connections.length}</span>}
        </div>
      </header>
      <main className="main">
        <div className="canvas-wrapper">
          <Canvas 
            width={canvasSize.width}
            height={canvasSize.height}
            onCanvasClick={handleCanvasClick}
          />
        </div>
        <aside className="sidebar">
          <div className="mermaid-panel">
            <h3>📋 Mermaid Flowchart Code</h3>
            <pre className="code-preview">
              <code>{mermaidCode}</code>
            </pre>
            <div className="panel-actions">
              <button 
                onClick={handleCopyCode}
                className={`copy-btn ${copySuccess ? 'success' : ''}`}
                disabled={!mermaidCode.trim()}
              >
                {copySuccess ? '✅ Copied!' : '📋 Copy Code'}
              </button>
              <button>👁 Show Preview</button>
            </div>
            {copySuccess && (
              <div className="copy-success-message">
                ✅ Mermaid code copied to clipboard!
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;