const puppeteer = require('puppeteer');

async function testUndoRedo() {
  console.log('🧪 Testing Undo/Redo functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 },
    devtools: true,
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:5174');
    await page.waitForSelector('.canvas-container', { timeout: 5000 });
    
    console.log('📱 Page loaded');
    
    // Take initial screenshot
    await page.screenshot({ path: 'temp/undo-01-initial.png' });
    console.log('📸 Initial state captured');
    
    // Click Add Node button to create first node
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Add Node'));
      if (button) button.click();
    });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'temp/undo-02-first-node.png' });
    console.log('📸 First node created');
    
    // Click Add Node button to create second node
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Add Node'));
      if (button) button.click();
    });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'temp/undo-03-second-node.png' });
    console.log('📸 Second node created');
    
    // Test Undo button
    console.log('🔄 Testing Undo button...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.title && btn.title.includes('Undo'));
      if (button) button.click();
    });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'temp/undo-04-after-undo-button.png' });
    console.log('📸 After Undo button click');
    
    // Test Redo button
    console.log('🔄 Testing Redo button...');
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.title && btn.title.includes('Redo'));
      if (button) button.click();
    });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'temp/undo-05-after-redo-button.png' });
    console.log('📸 After Redo button click');
    
    // Test Ctrl+Z keyboard shortcut
    console.log('⌨️ Testing Ctrl+Z shortcut...');
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'temp/undo-06-after-ctrl-z.png' });
    console.log('📸 After Ctrl+Z');
    
    // Test Ctrl+Y keyboard shortcut
    console.log('⌨️ Testing Ctrl+Y shortcut...');
    await page.keyboard.down('Control');
    await page.keyboard.press('y');
    await page.keyboard.up('Control');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'temp/undo-07-after-ctrl-y.png' });
    console.log('📸 After Ctrl+Y');
    
    // Check button states (disabled/enabled)
    const undoDisabled = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.title && btn.title.includes('Undo'));
      return button ? button.disabled : true;
    });
    const redoDisabled = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.title && btn.title.includes('Redo'));
      return button ? button.disabled : true;
    });
    
    console.log(`🔘 Undo button disabled: ${undoDisabled}`);
    console.log(`🔘 Redo button disabled: ${redoDisabled}`);
    
    // Get final node count
    const finalNodeCount = await page.$eval('.header-right', el => {
      const text = el.textContent;
      const match = text.match(/Nodes: (\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    console.log(`📊 Final node count: ${finalNodeCount}`);
    
    await page.screenshot({ path: 'temp/undo-08-final-state.png' });
    console.log('📸 Final state captured');
    
    console.log('✅ Undo/Redo test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'temp/undo-error.png' });
  } finally {
    await browser.close();
  }
}

testUndoRedo();