import puppeteer from 'puppeteer';

async function testSimpleEdit() {
  const browser = await puppeteer.launch({ 
    headless: false,  // Show browser to see what happens
    slowMo: 500
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5176');
    await page.waitForSelector('canvas');
    console.log('✅ Page loaded');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click on canvas to add node
    console.log('🖱️  Clicking canvas to add node...');
    await page.click('canvas', { offsetX: 400, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click on same area to enter edit mode
    console.log('🖱️  Clicking node to enter edit mode...');
    await page.click('canvas', { offsetX: 400, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try pressing Escape key
    console.log('⌨️  Pressing Escape key...');
    await page.keyboard.press('Escape');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try Ctrl+Enter
    console.log('⌨️  Pressing Ctrl+Enter...');
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Simple edit test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Keep browser open for a bit to see the result
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
  }
}

testSimpleEdit();