import puppeteer from 'puppeteer';

async function testConnectionSelection() {
  const browser = await puppeteer.launch({ 
    headless: "new",
    defaultViewport: { width: 1280, height: 720 }
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas');
    console.log('✅ Page loaded');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add two nodes using the toolbar button
    console.log('🖱️  Adding first node...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newNodeButton = buttons.find(btn => btn.textContent.includes('New Node'));
      if (newNodeButton) newNodeButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🖱️  Adding second node...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newNodeButton = buttons.find(btn => btn.textContent.includes('New Node'));
      if (newNodeButton) newNodeButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Move the nodes to different positions by dragging
    console.log('📦 Positioning first node...');
    await page.mouse.move(300, 200); // First node default position
    await page.mouse.down();
    await page.mouse.move(200, 200); // Drag to left
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('📦 Positioning second node...');
    await page.mouse.move(300, 200); // Second node might be on top of first
    await page.mouse.down();
    await page.mouse.move(500, 300); // Drag to right
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create connection between nodes
    console.log('🔗 Creating connection...');
    // This might need adjustment based on where connection points are located
    await page.mouse.move(180, 200); // Connection point of first node
    await page.mouse.down();
    await page.mouse.move(520, 300); // Connection point of second node
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🖱️  Clicking on connection line to select...');
    // Based on the screenshot, the line appears to be around the node area
    // Try clicking on the visible connection line
    await page.click('canvas', { offsetX: 800, offsetY: 480 }); // On the visible curved line
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try clicking on the arrow part
    await page.click('canvas', { offsetX: 860, offsetY: 480 }); // On the arrow
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try clicking on the center of the curve
    await page.click('canvas', { offsetX: 830, offsetY: 460 }); // Center of curve
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take a screenshot to see what's on screen
    await page.screenshot({ path: 'temp/debug-connection-selection.png' });
    console.log('📸 Screenshot saved to temp/debug-connection-selection.png');
    
    // Check if connections exist and their details
    const debugInfo = await page.evaluate(() => {
      const store = window.mindmapStore;
      if (store) {
        const state = store.getState();
        return {
          nodeCount: state.nodes.length,
          connectionCount: state.connections.length,
          connections: state.connections.map(conn => ({
            id: conn.id,
            from: conn.from,
            to: conn.to,
            isSelected: conn.isSelected
          })),
          nodes: state.nodes.map(node => ({
            id: node.id,
            text: node.text,
            position: node.position
          }))
        };
      }
      return null;
    });
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    
    // Check if connection is actually selected by inspecting console logs
    const connectionSelected = debugInfo ? debugInfo.connections.some(conn => conn.isSelected) : false;
    console.log('Connection selected:', connectionSelected);
    
    console.log('🖱️  Testing Delete Line button...');
    // Check if Delete Line button is enabled and click it
    const deleteLineButton = await page.$('button[title="Delete selected connection"]');
    if (deleteLineButton) {
      const isDisabled = await page.evaluate(btn => btn.disabled, deleteLineButton);
      if (!isDisabled) {
        await deleteLineButton.click();
        console.log('✅ Delete Line button clicked');
      } else {
        console.log('❌ Delete Line button is disabled');
      }
    } else {
      console.log('❌ Delete Line button not found');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Connection selection test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Keep browser open for a bit to see the result
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testConnectionSelection();