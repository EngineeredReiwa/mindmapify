import puppeteer from 'puppeteer';

async function buttonTest() {
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
    await page.waitForSelector('canvas');
    console.log('✅ Page loaded');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click "New Node" button
    console.log('🖱️  Clicking New Node button...');
    await page.click('button.primary');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await page.screenshot({ path: './temp/button-01-after-new-node.png', fullPage: true });
    console.log('📸 After New Node button click');
    
    // Now try to click on the actual node that was created
    // Let's click in the center area where the node should be
    console.log('🖱️  Clicking on canvas where node should be...');
    await page.click('canvas', { offsetX: 400, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ path: './temp/button-02-after-node-click.png', fullPage: true });
    console.log('📸 After node click');
    
    // Check for textarea
    const textarea = await page.$('textarea');
    if (textarea) {
      console.log('✅ SUCCESS! Textarea found - editing mode active');
      
      await textarea.type('Hello World');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await page.screenshot({ path: './temp/button-03-editing.png', fullPage: true });
      console.log('📸 Editing screenshot');
      
      // Test cursor position by moving it
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await page.screenshot({ path: './temp/button-04-cursor-moved.png', fullPage: true });
      console.log('📸 Cursor moved screenshot');
      
      // Get detailed cursor/text alignment info
      const alignmentInfo = await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        const textRect = textarea.getBoundingClientRect();
        const style = window.getComputedStyle(textarea);
        
        // Try to find the Konva Text element for comparison
        const canvas = document.querySelector('canvas');
        const canvasRect = canvas.getBoundingClientRect();
        
        return {
          textarea: {
            position: { x: textRect.x, y: textRect.y, width: textRect.width, height: textRect.height },
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            textAlign: style.textAlign,
            lineHeight: style.lineHeight,
            padding: style.padding,
            color: style.color,
            caretColor: style.caretColor
          },
          canvas: {
            position: { x: canvasRect.x, y: canvasRect.y, width: canvasRect.width, height: canvasRect.height }
          }
        };
      });
      
      console.log('📋 Alignment Info:', JSON.stringify(alignmentInfo, null, 2));
      
    } else {
      console.log('❌ Still no textarea found');
      
      // Try clicking different areas
      const clickAreas = [
        { x: 300, y: 250 },
        { x: 350, y: 300 },
        { x: 450, y: 350 },
        { x: 500, y: 400 }
      ];
      
      for (let i = 0; i < clickAreas.length; i++) {
        const area = clickAreas[i];
        console.log(`🖱️  Trying click at (${area.x}, ${area.y})...`);
        await page.click('canvas', { offsetX: area.x, offsetY: area.y });
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const textarea = await page.$('textarea');
        if (textarea) {
          console.log(`✅ Found textarea with click at (${area.x}, ${area.y})!`);
          await page.screenshot({ path: `./temp/button-found-${i}.png`, fullPage: true });
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

buttonTest();