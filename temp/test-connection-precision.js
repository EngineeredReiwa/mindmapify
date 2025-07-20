import puppeteer from 'puppeteer';

async function testConnectionPrecision() {
  console.log('🎯 Testing connection line double-click precision...\n');
  
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
    
    console.log('🔧 Setting up test scenario...');
    
    // Add two nodes
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get node positions
    const nodePositions = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(node => ({
        id: node.id,
        position: node.position,
        size: node.size
      }));
    });
    
    console.log('Node positions:', nodePositions);
    
    if (nodePositions.length >= 2) {
      console.log('🔗 Creating connection between nodes...');
      
      // Create connection by dragging from first node's connection point to second node
      const canvas = await page.$('canvas');
      const canvasBox = await canvas.boundingBox();
      
      const node1 = nodePositions[0];
      const node2 = nodePositions[1];
      
      // Calculate connection points (right side of first node, left side of second node)
      const startX = canvasBox.x + node1.position.x + node1.size.width;
      const startY = canvasBox.y + node1.position.y + node1.size.height / 2;
      const endX = canvasBox.x + node2.position.x;
      const endY = canvasBox.y + node2.position.y + node2.size.height / 2;
      
      console.log(`Connecting from (${startX}, ${startY}) to (${endX}, ${endY})`);
      
      // Drag to create connection
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 10 });
      await page.mouse.up();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if connection was created
      const connectionCount = await page.evaluate(() => {
        const store = window.useMindmapStore;
        return store.getState().connections.length;
      });
      
      console.log('Connections created:', connectionCount);
      
      if (connectionCount > 0) {
        console.log('✅ Connection created successfully');
        
        // Test double-click precision at multiple points
        console.log('\n🎯 Testing double-click precision at different points...');
        
        // Calculate connection line middle point
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        const testPoints = [
          { name: 'Connection start', x: startX + (endX - startX) * 0.2, y: startY + (endY - startY) * 0.2 },
          { name: 'Connection middle', x: midX, y: midY },
          { name: 'Connection end', x: startX + (endX - startX) * 0.8, y: startY + (endY - startY) * 0.8 },
        ];
        
        for (const point of testPoints) {
          console.log(`\n🔍 Testing ${point.name} at (${point.x.toFixed(0)}, ${point.y.toFixed(0)})...`);
          
          // First click to select the connection
          await page.mouse.click(point.x, point.y);
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Check if connection is selected
          const isSelected = await page.evaluate(() => {
            const store = window.useMindmapStore;
            const connections = store.getState().connections;
            return connections.some(conn => conn.isSelected);
          });
          
          console.log(`Selection result: ${isSelected ? 'SUCCESS' : 'FAILED'}`);
          
          if (isSelected) {
            // Test double-click for label editing
            await page.mouse.click(point.x, point.y, { clickCount: 2 });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if label editor appeared
            const isEditing = await page.evaluate(() => {
              const store = window.useMindmapStore;
              const connections = store.getState().connections;
              return connections.some(conn => conn.isEditingLabel);
            });
            
            console.log(`Label editing: ${isEditing ? 'SUCCESS' : 'FAILED'}`);
            
            if (isEditing) {
              // Cancel the editing
              await page.keyboard.press('Escape');
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        }
        
        console.log('\n🔍 Testing coordinate accuracy...');
        
        // Test precise coordinates by evaluating JavaScript directly
        const coordinateTest = await page.evaluate(() => {
          const store = window.useMindmapStore;
          const state = store.getState();
          const connection = state.connections[0];
          const nodes = state.nodes;
          
          if (!connection) return null;
          
          const fromNode = nodes.find(n => n.id === connection.from);
          const toNode = nodes.find(n => n.id === connection.to);
          
          if (!fromNode || !toNode) return null;
          
          // Calculate connection line bounds (same logic as Canvas.tsx)
          const fromCenter = {
            x: fromNode.position.x + fromNode.size.width / 2,
            y: fromNode.position.y + fromNode.size.height / 2,
          };
          const toCenter = {
            x: toNode.position.x + toNode.size.width / 2,
            y: toNode.position.y + toNode.size.height / 2,
          };
          
          const minX = Math.min(fromCenter.x, toCenter.x) - 30;
          const minY = Math.min(fromCenter.y, toCenter.y) - 30;
          const maxX = Math.max(fromCenter.x, toCenter.x) + 30;
          const maxY = Math.max(fromCenter.y, toCenter.y) + 30;
          
          return {
            connectionBounds: { minX, minY, maxX, maxY },
            fromCenter,
            toCenter,
            canvasZoom: state.canvas.zoom,
            canvasOffset: state.canvas.offset
          };
        });
        
        console.log('Connection bounds analysis:', coordinateTest);
        
      } else {
        console.log('❌ Failed to create connection');
      }
    }
    
    console.log('\n📊 Precision Test Results:');
    console.log('• Current implementation uses manual coordinate calculation');
    console.log('• Multiple event handlers on different elements may conflict');
    console.log('• Coordinate transformation depends on canvas zoom/offset state');
    console.log('• Hit detection area could be optimized for better UX');
    
    console.log('\n💡 Recommendations for improvement:');
    console.log('1. Simplify hit detection to use Konva\'s built-in capabilities');
    console.log('2. Increase hit area size for better user experience');
    console.log('3. Consolidate event handling to avoid conflicts');
    console.log('4. Add visual feedback during double-click detection');
    
    console.log('\n🎮 Browser will stay open for 20 seconds for manual testing...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testConnectionPrecision().catch(console.error);