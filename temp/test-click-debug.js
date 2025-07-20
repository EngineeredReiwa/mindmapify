import puppeteer from 'puppeteer';

async function testClickDebug() {
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    console.log('🌐 Loading page...');
    await page.goto('http://localhost:5173', { timeout: 10000 });
    await page.waitForSelector('canvas', { timeout: 5000 });
    console.log('✅ Page loaded');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if store is available
    const storeAvailable = await page.evaluate(() => {
      return typeof window.useMindmapStore !== 'undefined';
    });
    console.log('Store available:', storeAvailable);
    
    // Add nodes and create a connection
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        // Clear any existing state
        const state = store.getState();
        
        // Add two nodes
        store.getState().addNode({ x: 100, y: 100 }, 'Node 1');
        store.getState().addNode({ x: 300, y: 200 }, 'Node 2');
        
        // Get the nodes
        const newState = store.getState();
        if (newState.nodes.length >= 2) {
          const node1 = newState.nodes[0];
          const node2 = newState.nodes[1];
          console.log('Creating connection between nodes:', node1.id, node2.id);
          
          // Create connection
          store.getState().addConnection(node1.id, node2.id);
          
          // Log final state
          const finalState = store.getState();
          console.log('Final state - nodes:', finalState.nodes.length, 'connections:', finalState.connections.length);
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try clicking in the connection area
    console.log('🖱️  Trying to click connection line...');
    await page.click('canvas', { offsetX: 200, offsetY: 150 });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testClickDebug();