import puppeteer from 'puppeteer';

async function testWithoutEditor() {
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5174');
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log('✅ Page loaded with canvas');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click "New Node" button
    console.log('🖱️  Clicking New Node button...');
    await page.click('button.primary');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await page.screenshot({ path: './temp/no-editor-01-after-new-node.png', fullPage: true });
    console.log('📸 After New Node button click');
    
    // Check if canvas still exists
    const canvas = await page.$('canvas');
    if (canvas) {
      console.log('✅ Canvas still exists after New Node');
      
      // Try clicking on the node
      await page.click('canvas', { offsetX: 400, offsetY: 300 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ path: './temp/no-editor-02-after-click.png', fullPage: true });
      console.log('📸 After node click');
      
      // Check browser console for any node selection logs
      console.log('✅ Test completed without errors');
      
    } else {
      console.log('❌ Canvas disappeared after New Node click');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testWithoutEditor();