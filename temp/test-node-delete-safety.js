#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testNodeDeleteSafety() {
  console.log('🚨 Node Delete Safety Test Starting...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    // Load app
    console.log('🌐 Loading http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    
    // Wait for app to load
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a node
    console.log('🖱️ Creating a test node...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Add some text to the node
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 1) {
          state.updateNode(state.nodes[0].id, { 
            position: { x: 400, y: 300 },
            text: 'Test Text'
          });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot before editing
    await page.screenshot({ path: 'temp/delete-safety-01-before.png' });
    console.log('📸 Screenshot saved: delete-safety-01-before.png');
    
    // Double-click the node to start editing
    console.log('✏️ Starting node editing...');
    await page.click('canvas', { offsetX: 460, offsetY: 330 }); // Click on node center
    await new Promise(resolve => setTimeout(resolve, 200));
    await page.click('canvas', { offsetX: 460, offsetY: 330, clickCount: 2 }); // Double-click
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot while editing
    await page.screenshot({ path: 'temp/delete-safety-02-editing.png' });
    console.log('📸 Screenshot saved: delete-safety-02-editing.png');
    
    // Test dangerous scenario: Delete all text character by character
    console.log('🚨 Testing dangerous scenario: Deleting all text...');
    
    // Select all text and delete it
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA'); // Select all
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Delete all selected text
    await page.keyboard.press('Backspace');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try pressing Backspace again on empty text (this used to delete the node)
    console.log('🚨 Pressing Backspace on empty text...');
    await page.keyboard.press('Backspace');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try pressing Delete on empty text
    console.log('🚨 Pressing Delete on empty text...');
    await page.keyboard.press('Delete');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot after dangerous operations
    await page.screenshot({ path: 'temp/delete-safety-03-after-backspace.png' });
    console.log('📸 Screenshot saved: delete-safety-03-after-backspace.png');
    
    // Check if node still exists
    const nodeCount = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        return store.getState().nodes.length;
      }
      return 0;
    });
    
    console.log(`📊 Nodes remaining: ${nodeCount}`);
    
    if (nodeCount > 0) {
      console.log('✅ SUCCESS: Node was NOT accidentally deleted!');
    } else {
      console.log('❌ FAILURE: Node was accidentally deleted!');
    }
    
    // Save editing with Ctrl+Enter
    console.log('💾 Saving editing with Ctrl+Enter...');
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take final screenshot
    await page.screenshot({ path: 'temp/delete-safety-04-final.png' });
    console.log('📸 Screenshot saved: delete-safety-04-final.png');
    
    console.log('\n🚨 Node delete safety test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testNodeDeleteSafety().catch(console.error);