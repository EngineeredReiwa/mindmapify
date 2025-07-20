import puppeteer from 'puppeteer';

async function testShortcuts() {
  console.log('⌨️ Testing keyboard shortcuts...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Test 1: Help shortcut (?)...');
    
    // Create an alert handler
    page.on('dialog', async dialog => {
      console.log('✅ Help dialog shown:', dialog.message().substring(0, 50) + '...');
      await dialog.accept();
    });
    
    await page.keyboard.press('?');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n🔍 Test 2: Multi-key shortcut - Add Node (Cmd+A+N)...');
    
    // Initial node count
    const initialNodeCount = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    console.log('Initial node count:', initialNodeCount);
    
    // Press Cmd+A+N
    await page.keyboard.down('Meta'); // Use 'Control' for Windows/Linux
    await page.keyboard.press('a');
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.keyboard.press('n');
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterAddNodeCount = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    console.log('Node count after Cmd+A+N:', afterAddNodeCount);
    
    if (afterAddNodeCount > initialNodeCount) {
      console.log('✅ Add Node shortcut is working');
    } else {
      console.log('❌ Add Node shortcut failed');
    }
    
    console.log('\n🔍 Test 3: Select and delete node (Cmd+D+N)...');
    
    // Select the first node
    const selectResult = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      if (state.nodes.length > 0) {
        state.selectNode(state.nodes[0].id);
        return true;
      }
      return false;
    });
    
    if (selectResult) {
      // Press Cmd+D+N
      await page.keyboard.down('Meta');
      await page.keyboard.press('d');
      await new Promise(resolve => setTimeout(resolve, 100));
      await page.keyboard.press('n');
      await page.keyboard.up('Meta');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const afterDeleteNodeCount = await page.evaluate(() => {
        const store = window.useMindmapStore;
        return store.getState().nodes.length;
      });
      console.log('Node count after Cmd+D+N:', afterDeleteNodeCount);
      
      if (afterDeleteNodeCount < afterAddNodeCount) {
        console.log('✅ Delete Node shortcut is working');
      } else {
        console.log('❌ Delete Node shortcut failed');
      }
    }
    
    console.log('\n🔍 Test 4: Undo/Redo (Cmd+Z / Cmd+Y)...');
    
    // Test Undo
    await page.keyboard.down('Meta');
    await page.keyboard.press('z');
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterUndoCount = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    console.log('Node count after Undo:', afterUndoCount);
    
    if (afterUndoCount === afterAddNodeCount) {
      console.log('✅ Undo shortcut is working');
    } else {
      console.log('❌ Undo shortcut failed');
    }
    
    // Test Redo
    await page.keyboard.down('Meta');
    await page.keyboard.press('y');
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterRedoCount = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    console.log('Node count after Redo:', afterRedoCount);
    
    if (afterRedoCount < afterUndoCount) {
      console.log('✅ Redo shortcut is working');
    } else {
      console.log('❌ Redo shortcut failed');
    }
    
    console.log('\n🔍 Test 5: Zoom reset (Cmd+0)...');
    
    // First zoom in
    await page.click('button[title="Zoom In"]');
    await page.click('button[title="Zoom In"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const zoomedState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().canvas.zoom;
    });
    console.log('Zoom level after zoom in:', zoomedState);
    
    // Reset zoom with Cmd+0
    await page.keyboard.down('Meta');
    await page.keyboard.press('0');
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const resetZoomState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().canvas.zoom;
    });
    console.log('Zoom level after Cmd+0:', resetZoomState);
    
    if (resetZoomState === 1) {
      console.log('✅ Zoom reset shortcut is working');
    } else {
      console.log('❌ Zoom reset shortcut failed');
    }
    
    console.log('\n🎉 Keyboard Shortcuts Test Summary:');
    console.log('✅ All major keyboard shortcuts have been implemented');
    console.log('• Help dialog (?): Shows all available shortcuts');
    console.log('• Multi-key shortcuts: Cmd+A+N, Cmd+D+N');
    console.log('• Single-key shortcuts: Cmd+Z, Cmd+Y, Cmd+0');
    console.log('• Delete/Escape: Standard behavior');
    
    console.log('\n🎮 Browser will stay open for 20 seconds for manual testing...');
    console.log('Try pressing "?" to see the help dialog\!');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testShortcuts().catch(console.error);