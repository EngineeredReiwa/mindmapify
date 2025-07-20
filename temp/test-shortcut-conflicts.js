import puppeteer from 'puppeteer';

async function testShortcutConflicts() {
  console.log('🔍 Testing shortcut conflicts with browser...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Test 1: Command+A+N conflict test...');
    
    const initialTabCount = (await browser.pages()).length;
    console.log('Initial tab count:', initialTabCount);
    
    const initialNodeCount = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    console.log('Initial node count:', initialNodeCount);
    
    // Test Command+A+N
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.keyboard.press('n');
    await page.keyboard.up('Meta');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const afterTabCount = (await browser.pages()).length;
    const afterNodeCount = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().nodes.length;
    });
    
    console.log('After Command+A+N:');
    console.log('- Tab count:', afterTabCount);
    console.log('- Node count:', afterNodeCount);
    
    if (afterTabCount > initialTabCount) {
      console.log('❌ CONFLICT: Command+A+N opened a new tab/window');
      console.log('   This conflicts with browser shortcuts');
    } else if (afterNodeCount > initialNodeCount) {
      console.log('✅ SUCCESS: Command+A+N added a node without conflicts');
    } else {
      console.log('❓ UNCLEAR: No tab opened, but no node added either');
    }
    
    console.log('\n🔍 Test 2: Other browser shortcuts...');
    console.log('Testing some common browser shortcuts:');
    console.log('- Command+A: Select All');
    console.log('- Command+N: New Window/Tab');
    console.log('- Command+D: Bookmark');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n💡 Recommendations:');
    console.log('1. Use single letters for main actions:');
    console.log('   - Command+N: Add Node (New)');
    console.log('   - Command+D: Delete selected item');
    console.log('   - Command+C: Copy (for future)');
    console.log('');
    console.log('2. Or use different combinations:');
    console.log('   - Command+Shift+N: Add Node');
    console.log('   - Command+Shift+D: Delete');
    console.log('');
    console.log('3. Match UI button names:');
    console.log('   - "Add Node" → Command+A (but conflicts with Select All)');
    console.log('   - "Delete Node" → Command+Delete');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testShortcutConflicts().catch(console.error);