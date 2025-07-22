#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testJapaneseInput() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="stage"]', { timeout: 5000 });
    console.log('✅ Application loaded');

    // Create a node by clicking on the canvas
    await page.click('[data-testid="stage"]', { position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    console.log('✅ Node created');

    // Check if node is in editing mode
    const nodeElement = await page.$eval('[data-testid="stage"]', (stage) => {
      const nodes = stage.querySelectorAll('[data-node-id]');
      return nodes.length > 0;
    });
    
    if (!nodeElement) {
      console.error('❌ No node found after creation');
      return;
    }

    // Try to type Japanese text
    console.log('🔤 Testing Japanese input...');
    
    // Clear existing text first
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);
    
    // Type Japanese using IME simulation
    // First, let's try typing some romaji and see if it gets converted
    await page.keyboard.type('こんにちは');
    await page.waitForTimeout(1000);
    
    console.log('✅ Japanese text typed');
    
    // Save the text
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    await page.waitForTimeout(500);
    
    // Take a screenshot to verify
    await page.screenshot({ path: 'temp/japanese-input-test.png' });
    console.log('📸 Screenshot saved to temp/japanese-input-test.png');
    
    // Try to verify the text content
    const hasJapaneseText = await page.evaluate(() => {
      const konvaContent = document.querySelector('.konvajs-content');
      if (konvaContent) {
        const textContent = konvaContent.textContent || '';
        return textContent.includes('こんにちは') || textContent.includes('konnichiha');
      }
      return false;
    });
    
    if (hasJapaneseText) {
      console.log('✅ Japanese text successfully input and displayed');
    } else {
      console.log('⚠️ Japanese text may not have been input correctly');
      console.log('Note: Direct Japanese input may require manual testing with actual IME');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n👆 Please manually test Japanese input:');
    console.log('1. Click on a node to edit');
    console.log('2. Try typing Japanese characters using your IME');
    console.log('3. The characters should appear as you type');
    console.log('4. Press Ctrl+Enter to save');
    console.log('\nPress Ctrl+C to close the browser...');
    
    // Keep browser open for manual testing
    await new Promise(() => {});
  }
}

testJapaneseInput().catch(console.error);