import puppeteer from 'puppeteer';

async function testDeletion() {
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
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
    
    // Add first node
    console.log('🖱️  Adding first node...');
    await page.click('canvas', { offsetX: 300, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add second node  
    console.log('🖱️  Adding second node...');
    await page.click('canvas', { offsetX: 500, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click on first node to select it
    console.log('🖱️  Selecting first node...');
    await page.click('canvas', { offsetX: 300, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Press Delete key to delete selected node
    console.log('⌨️  Pressing Delete key...');
    await page.keyboard.press('Delete');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Deletion test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Keep browser open for a bit to see the result
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testDeletion();