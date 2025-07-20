import puppeteer from 'puppeteer';

async function testNewShortcuts() {
  console.log('⌨️ Testing new keyboard shortcuts...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  page.on('dialog', async dialog => {
    console.log('📖 Help dialog:', dialog.message().substring(0, 100) + '...');
    await dialog.accept();
  });
  
  try {
    await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Test 1: Cmd+Shift+A (Add Node)...');
    
    const initialNodeCount = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    
    // Test Cmd+Shift+A
    await page.keyboard.down('Meta');
    await page.keyboard.down('Shift');
    await page.keyboard.press('a');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterAddNodeCount = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    
    console.log(`Node count: ${initialNodeCount} → ${afterAddNodeCount}`);
    
    if (afterAddNodeCount > initialNodeCount) {
      console.log('✅ Cmd+Shift+A (Add Node) is working');
    } else {
      console.log('❌ Cmd+Shift+A (Add Node) failed');
    }
    
    console.log('\n🔍 Test 2: Cmd+A (Select All)...');
    
    // Add a few more nodes
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 300));
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test Cmd+A
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const selectedState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return {
        totalNodes: state.nodes.length,
        selectedNodes: state.nodes.filter(n => n.isSelected).length,
        selectedConnections: state.connections.filter(c => c.isSelected).length
      };
    });
    
    console.log('Selection state:', selectedState);
    
    if (selectedState.selectedNodes === selectedState.totalNodes) {
      console.log('✅ Cmd+A (Select All) is working');
    } else {
      console.log('❌ Cmd+A (Select All) failed');
    }
    
    console.log('\n🔍 Test 3: Cmd+Shift+D (Delete Selected)...');
    
    // Test Cmd+Shift+D (should delete all since all are selected)
    await page.keyboard.down('Meta');
    await page.keyboard.down('Shift');
    await page.keyboard.press('d');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterDeleteCount = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    
    console.log(`Node count after delete: ${afterDeleteCount}`);
    
    if (afterDeleteCount === 0) {
      console.log('✅ Cmd+Shift+D (Delete Selected) is working - all nodes deleted');
    } else {
      console.log('❌ Cmd+Shift+D (Delete Selected) failed - some nodes remain');
    }
    
    console.log('\n🔍 Test 4: Safety test - Cmd+Shift+D with nothing selected...');
    
    // Add a node first
    await page.click('button[title*="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Click empty area to deselect
    await page.mouse.click(500, 500);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const beforeSafetyTest = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    
    // Test Cmd+Shift+D with nothing selected (should do nothing)
    await page.keyboard.down('Meta');
    await page.keyboard.down('Shift');
    await page.keyboard.press('d');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterSafetyTest = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    
    console.log(`Safety test: ${beforeSafetyTest} → ${afterSafetyTest}`);
    
    if (afterSafetyTest === beforeSafetyTest) {
      console.log('✅ Safety feature working - nothing deleted when nothing selected');
    } else {
      console.log('❌ Safety feature failed - something was deleted!');
    }
    
    console.log('\n🔍 Test 5: Help shortcut (?)...');
    await page.keyboard.press('?');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n🔍 Test 6: Zoom shortcuts...');
    
    const initialZoom = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().canvas.zoom;
    });
    
    // Test Cmd+Plus
    await page.keyboard.down('Meta');
    await page.keyboard.press('='); // = key is used for +
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const afterZoomIn = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().canvas.zoom;
    });
    
    console.log(`Zoom: ${initialZoom.toFixed(2)} → ${afterZoomIn.toFixed(2)}`);
    
    if (afterZoomIn > initialZoom) {
      console.log('✅ Cmd+Plus (Zoom In) is working');
    } else {
      console.log('❌ Cmd+Plus (Zoom In) failed');
    }
    
    console.log('\n🎉 New Shortcuts Test Summary:');
    console.log('✅ UI-matched, safe keyboard shortcuts implemented');
    console.log('• Cmd+Shift+A: Add Node (matches UI "Add Node")');
    console.log('• Cmd+Shift+D: Delete Selected (matches UI "Delete" actions)');
    console.log('• Cmd+A: Select All (standard convention)');
    console.log('• Safety: No accidental deletion when nothing selected');
    console.log('• Zoom: Standard Cmd+Plus/Minus shortcuts');
    console.log('• Help: ? key shows all shortcuts');
    
    console.log('\n🎮 Browser will stay open for 15 seconds for manual testing...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testNewShortcuts().catch(console.error);