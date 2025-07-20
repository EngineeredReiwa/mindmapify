import puppeteer from 'puppeteer';

async function testConnectionIssues() {
  console.log('🔍 Testing connection-related issues...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5175', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔧 Issue 1: Testing connection point stability during node movement...');
    
    // Add two nodes
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 300));
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get initial positions
    const initialPositions = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(node => ({
        id: node.id,
        position: node.position,
        size: node.size
      }));
    });
    
    console.log('Initial node positions:', initialPositions);
    
    if (initialPositions.length >= 2) {
      const canvas = await page.$('canvas');
      const canvasBox = await canvas.boundingBox();
      
      const node1 = initialPositions[0];
      const node2 = initialPositions[1];
      
      // Create connection from node1 to node2
      const startX = canvasBox.x + node1.position.x + node1.size.width;
      const startY = canvasBox.y + node1.position.y + node1.size.height / 2;
      const endX = canvasBox.x + node2.position.x;
      const endY = canvasBox.y + node2.position.y + node2.size.height / 2;
      
      console.log(`Creating connection: (${startX}, ${startY}) → (${endX}, ${endY})`);
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 10 });
      await page.mouse.up();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check connection was created
      const connectionData = await page.evaluate(() => {
        const store = window.useMindmapStore;
        const state = store.getState();
        return {
          connectionCount: state.connections.length,
          connections: state.connections.map(conn => ({
            id: conn.id,
            from: conn.from,
            to: conn.to
          }))
        };
      });
      
      console.log('Connection data:', connectionData);
      
      if (connectionData.connectionCount > 0) {
        console.log('✅ Connection created');
        
        // Now move node1 and observe connection behavior
        console.log('\n🔄 Moving node1 to test connection stability...');
        
        const node1CenterX = canvasBox.x + node1.position.x + node1.size.width / 2;
        const node1CenterY = canvasBox.y + node1.position.y + node1.size.height / 2;
        
        // Drag node1 to a new position
        await page.mouse.move(node1CenterX, node1CenterY);
        await page.mouse.down();
        await page.mouse.move(node1CenterX + 100, node1CenterY - 50, { steps: 15 });
        await page.mouse.up();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Node1 moved - observing connection behavior...');
        
        // Take screenshot for manual verification
        await page.screenshot({ path: 'temp/connection-after-move.png' });
        console.log('📸 Screenshot saved: temp/connection-after-move.png');
        
        console.log('\n🔍 Issue 2: Testing arrow head visibility...');
        
        // Add another connection to test arrow head visibility
        const newPositions = await page.evaluate(() => {
          const store = window.useMindmapStore;
          const state = store.getState();
          return state.nodes.map(node => ({
            id: node.id,
            position: node.position,
            size: node.size
          }));
        });
        
        if (newPositions.length >= 2) {
          const updatedNode1 = newPositions[0];
          const node2Updated = newPositions[1];
          
          // Create another connection from different angle
          const start2X = canvasBox.x + updatedNode1.position.x + updatedNode1.size.width / 2;
          const start2Y = canvasBox.y + updatedNode1.position.y + updatedNode1.size.height;
          const end2X = canvasBox.x + node2Updated.position.x + node2Updated.size.width / 2;
          const end2Y = canvasBox.y + node2Updated.position.y;
          
          console.log(`Creating second connection: (${start2X}, ${start2Y}) → (${end2X}, ${end2Y})`);
          
          await page.mouse.move(start2X, start2Y);
          await page.mouse.down();
          await page.mouse.move(end2X, end2Y, { steps: 10 });
          await page.mouse.up();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await page.screenshot({ path: 'temp/arrow-head-visibility.png' });
          console.log('📸 Screenshot saved: temp/arrow-head-visibility.png');
        }
        
        console.log('\n🔍 Issue 3: Testing connection editing mode complexity...');
        
        // Click on a connection to select it
        const midX = canvasBox.x + 300;
        const midY = canvasBox.y + 200;
        
        await page.mouse.click(midX, midY);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if connection is selected
        const isSelected = await page.evaluate(() => {
          const store = window.useMindmapStore;
          const connections = store.getState().connections;
          return connections.some(conn => conn.isSelected);
        });
        
        console.log('Connection selected:', isSelected);
        
        if (isSelected) {
          await page.screenshot({ path: 'temp/connection-selected-handles.png' });
          console.log('📸 Screenshot saved: temp/connection-selected-handles.png');
          
          console.log('🔍 Testing handle click behavior...');
          
          // Try clicking on a handle to see the editing mode
          await page.mouse.click(midX - 50, midY - 30); // Approximate handle position
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const editingState = await page.evaluate(() => {
            const store = window.useMindmapStore;
            const state = store.getState();
            return {
              isEditingConnection: state.canvas.isEditingConnection,
              editingConnectionId: state.canvas.editingConnectionId,
              editingEndpoint: state.canvas.editingEndpoint
            };
          });
          
          console.log('Editing state after handle click:', editingState);
          
          await page.screenshot({ path: 'temp/connection-endpoint-editing.png' });
          console.log('📸 Screenshot saved: temp/connection-endpoint-editing.png');
        }
      }
    }
    
    console.log('\n📋 Issues Analysis:');
    console.log('1. Connection Point Stability: Connection points should remain fixed to specific node edges');
    console.log('2. Arrow Head Visibility: Arrow heads may be hidden by connection points or positioned incorrectly');
    console.log('3. Editing Mode Complexity: Two-step editing (select → endpoint edit) may be confusing');
    
    console.log('\n🎮 Browser stays open for 30 seconds for manual verification...');
    console.log('Please manually test:');
    console.log('- Move nodes and observe connection behavior');
    console.log('- Check arrow head visibility at different angles');
    console.log('- Try the connection editing workflow');
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testConnectionIssues().catch(console.error);