import puppeteer from 'puppeteer';

async function testPrecisionImprovements() {
  console.log('🎯 Testing connection precision improvements...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
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
    
    // Add nodes in specific positions for testing
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 300));
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 300));
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
      console.log('🔗 Creating multiple connections for precision testing...');
      
      const canvas = await page.$('canvas');
      const canvasBox = await canvas.boundingBox();
      
      // Create connection 1: node 0 -> node 1
      const node1 = nodePositions[0];
      const node2 = nodePositions[1];
      
      const startX1 = canvasBox.x + node1.position.x + node1.size.width;
      const startY1 = canvasBox.y + node1.position.y + node1.size.height / 2;
      const endX1 = canvasBox.x + node2.position.x;
      const endY1 = canvasBox.y + node2.position.y + node2.size.height / 2;
      
      console.log(`Connection 1: (${startX1}, ${startY1}) → (${endX1}, ${endY1})`);
      
      await page.mouse.move(startX1, startY1);
      await page.mouse.down();
      await page.mouse.move(endX1, endY1, { steps: 10 });
      await page.mouse.up();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create connection 2: node 1 -> node 2 (if exists)
      if (nodePositions.length >= 3) {
        const node3 = nodePositions[2];
        
        const startX2 = canvasBox.x + node2.position.x + node2.size.width;
        const startY2 = canvasBox.y + node2.position.y + node2.size.height / 2;
        const endX2 = canvasBox.x + node3.position.x;
        const endY2 = canvasBox.y + node3.position.y + node3.size.height / 2;
        
        console.log(`Connection 2: (${startX2}, ${startY2}) → (${endX2}, ${endY2})`);
        
        await page.mouse.move(startX2, startY2);
        await page.mouse.down();
        await page.mouse.move(endX2, endY2, { steps: 10 });
        await page.mouse.up();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const connectionCount = await page.evaluate(() => {
        const store = window.useMindmapStore;
        return store.getState().connections.length;
      });
      
      console.log(`✅ ${connectionCount} connections created`);
      
      if (connectionCount > 0) {
        console.log('\n🎯 Testing improved double-click precision...');
        
        // Test multiple precise points on the first connection
        const testPoints = [
          { name: 'Near start (20%)', ratio: 0.2 },
          { name: 'Quarter point (25%)', ratio: 0.25 },
          { name: 'Mid-point (50%)', ratio: 0.5 },
          { name: 'Three-quarter (75%)', ratio: 0.75 },
          { name: 'Near end (80%)', ratio: 0.8 }
        ];
        
        let successCount = 0;
        let totalTests = testPoints.length;
        
        for (const testPoint of testPoints) {
          console.log(`\n🔍 Testing ${testPoint.name}...`);
          
          // Calculate precise point on the line
          const x = startX1 + (endX1 - startX1) * testPoint.ratio;
          const y = startY1 + (endY1 - startY1) * testPoint.ratio;
          
          console.log(`Clicking at (${x.toFixed(0)}, ${y.toFixed(0)})`);
          
          // Single click to select
          await page.mouse.click(x, y);
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Check if connection is selected
          const isSelected = await page.evaluate(() => {
            const store = window.useMindmapStore;
            const connections = store.getState().connections;
            return connections.some(conn => conn.isSelected);
          });
          
          if (isSelected) {
            console.log('✅ Selection successful');
            
            // Double-click for label editing
            await page.mouse.click(x, y, { clickCount: 2 });
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Check if label editor appeared
            const isEditing = await page.evaluate(() => {
              const store = window.useMindmapStore;
              const connections = store.getState().connections;
              return connections.some(conn => conn.isEditingLabel);
            });
            
            if (isEditing) {
              console.log('✅ Label editing triggered successfully');
              successCount++;
              
              // Cancel editing
              await page.keyboard.press('Escape');
              await new Promise(resolve => setTimeout(resolve, 200));
            } else {
              console.log('❌ Label editing failed');
            }
          } else {
            console.log('❌ Selection failed');
          }
          
          // Clear selection for next test
          await page.mouse.click(500, 500);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.log(`\n📊 Precision Test Results:`);
        console.log(`• Success rate: ${successCount}/${totalTests} (${(successCount/totalTests*100).toFixed(1)}%)`);
        console.log(`• Target: >80% success rate for improved UX`);
        
        if (successCount / totalTests >= 0.8) {
          console.log('✅ PASSED: Connection precision significantly improved!');
        } else {
          console.log('⚠️ NEEDS WORK: Precision still needs improvement');
        }
        
        console.log('\n🎯 Testing edge cases...');
        
        // Test very close to handles (should not trigger label editing)
        console.log('Testing near connection handles...');
        
        // Click very close to start handle
        await page.mouse.click(startX1 + 5, startY1 + 5);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const handleTestResult = await page.evaluate(() => {
          const store = window.useMindmapStore;
          const state = store.getState();
          return {
            isSelected: state.connections.some(conn => conn.isSelected),
            isEditingEndpoint: state.canvas.isEditingConnection
          };
        });
        
        console.log('Handle test result:', handleTestResult);
        
        if (handleTestResult.isEditingEndpoint) {
          console.log('✅ Handle interaction working correctly');
          // Cancel endpoint editing
          await page.keyboard.press('Escape');
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      }
    }
    
    console.log('\n💡 Improvements implemented:');
    console.log('• Increased hit area from 20px to 30px');
    console.log('• Improved line distance calculation (point-to-line)');
    console.log('• Reduced double-click timing from 500ms to 400ms');
    console.log('• Better event isolation between handles and line');
    console.log('• Enhanced visual feedback for editing modes');
    
    console.log('\n🎮 Browser will stay open for 15 seconds for manual testing...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testPrecisionImprovements().catch(console.error);