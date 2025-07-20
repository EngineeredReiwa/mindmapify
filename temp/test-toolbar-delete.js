import puppeteer from 'puppeteer';

async function testToolbarDelete() {
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
    
    // Check initial state of buttons
    console.log('🔍 Checking initial button states...');
    
    // Add a node using New Node button
    console.log('🖱️  Clicking New Node button...');
    await page.click('button.primary');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add another node
    console.log('🖱️  Adding second node via canvas...');
    await page.click('canvas', { offsetX: 500, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Select first node
    console.log('🖱️  Selecting first node...');
    await page.click('canvas', { offsetX: 300, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test individual Delete button
    console.log('🖱️  Clicking Delete button (individual)...');
    const deleteButtons = await page.$$('button.danger');
    if (deleteButtons.length >= 1) {
      await deleteButtons[0].click(); // First danger button should be "Delete"
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Individual delete completed');
    }
    
    // Test All Delete button
    console.log('🖱️  Clicking All Delete button...');
    const allDeleteButtons = await page.$$('button.danger');
    if (allDeleteButtons.length >= 1) {
      await allDeleteButtons[allDeleteButtons.length - 1].click(); // Last danger button should be "All Delete"
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ All delete completed');
    }
    
    console.log('✅ Toolbar delete test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Keep browser open for a bit to see the result
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
  }
}

testToolbarDelete();