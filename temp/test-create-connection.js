import puppeteer from 'puppeteer';

async function testCreateConnection() {
  const browser = await puppeteer.launch({ 
    headless: "new",
    defaultViewport: { width: 1280, height: 720 }
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5174');
    await page.waitForSelector('canvas');
    console.log('✅ Page loaded');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add two nodes
    console.log('🖱️  Adding first node...');
    await page.click('canvas', { offsetX: 200, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🖱️  Adding second node...');
    await page.click('canvas', { offsetX: 400, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Let's use the store directly to create a connection
    console.log('📝 Using store to create connection...');
    await page.evaluate(() => {
      // Access the store and create a connection manually
      const store = window.useMindmapStore || window.zustandStore;
      if (store) {
        const state = store.getState();
        console.log('Current nodes:', state.nodes.length);
        console.log('Current connections:', state.connections.length);
        
        if (state.nodes.length >= 2) {
          const node1 = state.nodes[0];
          const node2 = state.nodes[1];
          console.log('Creating connection from', node1.id, 'to', node2.id);
          state.addConnection(node1.id, node2.id);
          
          // Check if connection was added
          const newState = store.getState();
          console.log('Connections after adding:', newState.connections.length);
          console.log('Connection details:', newState.connections[0]);
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now try to click on the connection line
    console.log('🖱️  Attempting to click connection line...');
    await page.click('canvas', { offsetX: 300, offsetY: 250 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Connection creation test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Keep browser open to inspect
    await new Promise(resolve => setTimeout(resolve, 15000));
    await browser.close();
  }
}

testCreateConnection();