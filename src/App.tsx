import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { Canvas } from './components/Canvas/Canvas';
import { Toolbar } from './components/Toolbar/Toolbar';
import { EditBar } from './components/EditBar/EditBar';
import { useNodes, useConnections, useMindmapStore } from './stores/mindmapStore';
import { MermaidGenerator } from './utils/mermaidGenerator';

function App() {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw' | 'llm'>('raw');
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
      const editBar = document.querySelector('.edit-bar');
      const sidebarWidth = sidebar?.clientWidth || 300;
      const headerHeight = header?.clientHeight || 50;
      const editBarHeight = editBar?.clientHeight || 0;
      
      setCanvasSize({
        width: window.innerWidth - sidebarWidth,
        height: window.innerHeight - headerHeight - editBarHeight,
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

  // Generate Mermaid Flowchart code for preview (regular structure, memoized for performance)
  const mermaidCode = useMemo(() => {
    const generator = new MermaidGenerator(nodes, connections);
    return generator.generateFlowchartCode();
  }, [nodes, connections]);

  // Generate structured Mermaid code for LLM optimization (memoized for performance)
  const structuredMermaidCode = useMemo(() => {
    const generator = new MermaidGenerator(nodes, connections);
    return generator.generateStructuredFlowchartCode();
  }, [nodes, connections]);

  // Handle copy to clipboard with feedback for Raw tab
  const handleCopyRawCode = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
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

  // Handle copy to clipboard with feedback for LLM tab
  const handleCopyLLMCode = async () => {
    try {
      await navigator.clipboard.writeText(structuredMermaidCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = structuredMermaidCode;
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
      <EditBar />
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
            
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button 
                className={`tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
                onClick={() => setActiveTab('raw')}
              >
                📄 Raw
              </button>
              <button 
                className={`tab-btn ${activeTab === 'llm' ? 'active' : ''}`}
                onClick={() => setActiveTab('llm')}
                disabled={!mermaidCode.trim()}
              >
                🧠 LLM最適化
              </button>
            </div>

            {/* Code Display */}
            <pre className="code-preview">
              <code>{activeTab === 'raw' ? mermaidCode : structuredMermaidCode}</code>
            </pre>
            
            {/* Tab-specific Actions */}
            <div className="panel-actions">
              {activeTab === 'raw' ? (
                <>
                  <button 
                    onClick={handleCopyRawCode}
                    className={`copy-btn ${copySuccess ? 'success' : ''}`}
                    disabled={!mermaidCode.trim()}
                  >
                    {copySuccess ? '✅ Copied!' : '📋 Copy Raw'}
                  </button>
                  <button>👁 Show Preview</button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleCopyLLMCode}
                    className={`copy-btn ${copySuccess ? 'success' : ''}`}
                    disabled={!structuredMermaidCode.trim()}
                    title="LLM分析用に最適化されたMermaidコードをコピーします"
                  >
                    {copySuccess ? '✅ Copied!' : '🧠 Copy for LLM'}
                  </button>
                  <button>💬 Discuss with LLM</button>
                </>
              )}
            </div>
            
            {/* Success Message */}
            {copySuccess && (
              <div className="copy-success-message">
                ✅ {activeTab === 'raw' ? 'Raw' : 'LLM最適化'} Mermaidコードをコピーしました！
              </div>
            )}
            
            {/* Tab Description */}
            <div className="tab-description">
              {activeTab === 'raw' ? (
                <small>🔧 編集用の標準フォーマットです</small>
              ) : (
                <small>🧠 最長チェーンを主軸とし、LLM分析に最適化された構造です</small>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;