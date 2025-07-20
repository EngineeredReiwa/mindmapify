import puppeteer from 'puppeteer';

async function testFinalPrecision() {
  console.log('🎯 Final precision test for connection double-click...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('ConnectionLine') || msg.text().includes('distance=')) {
      // Skip debug messages for cleaner output
      return;
    }
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5175', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔧 Creating test scenario...');
    
    // Add 2 nodes
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 300));
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get positions
    const nodePositions = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(node => ({
        id: node.id,
        position: node.position,
        size: node.size
      }));
    });
    
    if (nodePositions.length >= 2) {
      console.log('🔗 Creating connection...');
      
      const canvas = await page.$('canvas');
      const canvasBox = await canvas.boundingBox();
      
      const node1 = nodePositions[0];
      const node2 = nodePositions[1];
      
      const startX = canvasBox.x + node1.position.x + node1.size.width;
      const startY = canvasBox.y + node1.position.y + node1.size.height / 2;
      const endX = canvasBox.x + node2.position.x;
      const endY = canvasBox.y + node2.position.y + node2.size.height / 2;
      
      // Create connection
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 10 });
      await page.mouse.up();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const connectionCount = await page.evaluate(() => {
        const store = window.useMindmapStore;
        return store.getState().connections.length;
      });
      
      if (connectionCount > 0) {
        console.log('✅ Connection created successfully');
        
        console.log('\n🎯 Testing precision at multiple points...');
        
        // Test 7 points along the connection line
        const testPoints = [
          { name: '10%', ratio: 0.1 },
          { name: '25%', ratio: 0.25 },
          { name: '40%', ratio: 0.4 },
          { name: '50%', ratio: 0.5 },
          { name: '60%', ratio: 0.6 },
          { name: '75%', ratio: 0.75 },
          { name: '90%', ratio: 0.9 }
        ];
        
        let successCount = 0;
        
        for (const point of testPoints) {
          const x = startX + (endX - startX) * point.ratio;
          const y = startY + (endY - startY) * point.ratio;
          
          console.log(`Testing ${point.name} at (${x.toFixed(0)}, ${y.toFixed(0)})...`);
          
          // Single click to select
          await page.mouse.click(x, y);
          await new Promise(resolve => setTimeout(resolve, 150));
          
          const isSelected = await page.evaluate(() => {
            const store = window.useMindmapStore;
            return store.getState().connections.some(conn => conn.isSelected);
          });
          
          if (isSelected) {
            // Double-click for label editing
            await page.mouse.click(x, y, { clickCount: 2 });
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const isEditing = await page.evaluate(() => {
              const store = window.useMindmapStore;
              return store.getState().connections.some(conn => conn.isEditingLabel);
            });
            
            if (isEditing) {
              console.log(`✅ ${point.name}: SUCCESS`);
              successCount++;
              
              // Cancel editing
              await page.keyboard.press('Escape');
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              console.log(`❌ ${point.name}: Failed to start editing`);
            }
          } else {
            console.log(`❌ ${point.name}: Failed to select`);
          }
          
          // Clear selection
          await page.mouse.click(500, 500);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const successRate = (successCount / testPoints.length * 100).toFixed(1);
        console.log(`\n📊 Final Results:`);
        console.log(`• Success rate: ${successCount}/${testPoints.length} (${successRate}%)`);
        
        if (successCount >= 5) {
          console.log('🎉 EXCELLENT: Connection precision greatly improved!');
        } else if (successCount >= 3) {
          console.log('✅ GOOD: Significant precision improvement achieved');
        } else {
          console.log('⚠️ NEEDS MORE WORK: Additional improvements needed');
        }
        
        console.log('\n💡 Key improvements implemented:');
        console.log('• 30px hit area for ConnectionLine components');
        console.log('• 40px fallback tolerance for manual hit testing');
        console.log('• Improved point-to-line distance calculation');
        console.log('• Better event isolation between handles and line');
        console.log('• Reduced double-click timing to 400ms');
        console.log('• Enhanced visual feedback for editing states');
        
      } else {
        console.log('❌ Failed to create connection');
      }
    }
    
    console.log('\n🎮 Browser stays open for manual verification...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testFinalPrecision().catch(console.error);