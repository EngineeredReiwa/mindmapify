#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testAddNode() {
  console.log('🧪 Testing Add Node functionality...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--disable-dev-shm-usage', '--no-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:5173');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="stage"]', { timeout: 10000 });
    console.log('✅ App loaded');

    // Wait for store to be available
    await page.waitForFunction(() => window.mindmapStore !== undefined, { timeout: 5000 });
    console.log('✅ Store available');

    // Check initial state
    const initialNodes = await page.evaluate(() => {
      const state = window.mindmapStore.getState();
      return state.nodes.length;
    });
    console.log('📊 Initial nodes:', initialNodes);

    // Click Add Node button
    const addButton = await page.$('button:has-text("Add Node")');
    if (!addButton) {
      // Try alternative selector
      const buttons = await page.$$('button');
      let found = false;
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && text.includes('Add Node')) {
          await button.click();
          found = true;
          break;
        }
      }
      if (!found) {
        console.log('❌ Add Node button not found');
        await page.screenshot({ path: 'temp/error-no-button.png' });
        return;
      }
    } else {
      await addButton.click();
    }
    
    console.log('🖱️ Add Node button clicked');
    await page.waitForTimeout(1000);

    // Check if node was added
    const finalNodes = await page.evaluate(() => {
      const state = window.mindmapStore.getState();
      console.log('Current state:', state);
      return {
        count: state.nodes.length,
        nodes: state.nodes.map(n => ({ id: n.id, text: n.text, position: n.position }))
      };
    });
    
    console.log('📊 Final nodes:', finalNodes.count);
    console.log('📊 Node details:', finalNodes.nodes);

    if (finalNodes.count > initialNodes) {
      console.log('✅ Node successfully added!');
    } else {
      console.log('❌ Node was NOT added');
      await page.screenshot({ path: 'temp/error-no-node-added.png' });
    }

    // Keep browser open for inspection
    console.log('🔍 Browser left open for inspection. Press Ctrl+C to close.');
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (browser) {
      await browser.close();
    }
  }
}

testAddNode();