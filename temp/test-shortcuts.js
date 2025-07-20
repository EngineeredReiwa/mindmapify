const puppeteer = require('puppeteer');

async function testKeyboardShortcuts() {
  console.log('🎹 Testing Keyboard Shortcuts...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: false 
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Loading http://localhost:5175...');
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle0' });
    
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log('✅ Canvas loaded');
    
    await page.click('body');
    
    console.log('\n🔹 Test 1: Command+A+N (Add Node)');
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.press('n');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(1000);
    
    const nodeCount1 = await page.$eval('.header-right span', el => el.textContent);
    console.log('   📊 Node count after Command+A+N:', nodeCount1);
    
    console.log('\n🔹 Test 2: Command+A+N (Add second node)');
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.press('n');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(1000);
    
    const nodeCount2 = await page.$eval('.header-right span', el => el.textContent);
    console.log('   📊 Node count after second Command+A+N:', nodeCount2);
    
    console.log('\n🔹 Test 3: Command+Z (Undo)');
    await page.keyboard.down('Meta');
    await page.keyboard.press('z');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(1000);
    
    const nodeCount3 = await page.$eval('.header-right span', el => el.textContent);
    console.log('   📊 Node count after Command+Z (Undo):', nodeCount3);
    
    console.log('\n🔹 Test 4: Command+Y (Redo)');
    await page.keyboard.down('Meta');
    await page.keyboard.press('y');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(1000);
    
    const nodeCount4 = await page.$eval('.header-right span', el => el.textContent);
    console.log('   📊 Node count after Command+Y (Redo):', nodeCount4);
    
    console.log('\n✅ Keyboard shortcut tests completed!');
    console.log('📌 Keep browser open for 5 seconds for verification...');
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testKeyboardShortcuts();