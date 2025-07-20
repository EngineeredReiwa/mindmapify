import puppeteer from 'puppeteer';

async function testManualConnection() {
  const browser = await puppeteer.launch({ 
    headless: "new",
    defaultViewport: { width: 1280, height: 720 }
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    console.log('🌐 Loading page...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas');
    console.log('✅ Page loaded');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add two nodes
    console.log('🖱️  Adding first node...');
    await page.click('canvas', { offsetX: 200, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🖱️  Adding second node...');
    await page.click('canvas', { offsetX: 400, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Manually create a connection using the store
    console.log('📝 Creating connection manually...');
    const connectionCreated = await page.evaluate(() => {
      try {
        const store = window.useMindmapStore;
        if (!store) {
          console.log('Store not found on window');
          return false;
        }
        
        const state = store.getState();
        console.log('Current state - Nodes:', state.nodes.length, 'Connections:', state.connections.length);
        
        if (state.nodes.length >= 2) {
          const node1 = state.nodes[0];
          const node2 = state.nodes[1];
          console.log('Creating connection from', node1.id, 'to', node2.id);
          
          // Use addConnection method
          state.addConnection(node1.id, node2.id);
          
          // Check if connection was added
          const newState = store.getState();
          console.log('After addConnection - Connections:', newState.connections.length);
          
          if (newState.connections.length > 0) {
            console.log('Connection created:', newState.connections[0]);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Error creating connection:', error);
        return false;
      }
    });
    
    console.log('Connection created:', connectionCreated);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (connectionCreated) {
      // Now try to click on the connection line
      console.log('🖱️  Attempting to click connection line area...');
      
      // Try multiple points along where the line should be
      const clickPoints = [
        { x: 250, y: 220 },
        { x: 300, y: 250 },
        { x: 350, y: 280 },
      ];
      
      for (const point of clickPoints) {
        console.log(`🖱️  Clicking at (${point.x}, ${point.y})`);
        await page.click('canvas', { offsetX: point.x, offsetY: point.y });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('✅ Manual connection test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Keep browser open to inspect
    await new Promise(resolve => setTimeout(resolve, 15000));
    await browser.close();
  }
}

testManualConnection();