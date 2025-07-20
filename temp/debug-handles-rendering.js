#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function debugHandlesRendering() {
  console.log('🔍 Debugging handle rendering...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Setup and debug rendering
    const debugInfo = await page.evaluate(() => {
      const store = window.useMindmapStore;
      let state = store.getState();
      
      // Add nodes and connection
      state.addNode({ x: 200, y: 200 }, 'Node A');
      state.addNode({ x: 500, y: 200 }, 'Node B');
      
      state = store.getState();
      if (state.nodes.length >= 2) {
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        
        // Select the connection
        state = store.getState();
        if (state.connections.length > 0) {
          state.selectConnection(state.connections[0].id);
          
          // Debug connection state
          const finalState = store.getState();
          const connection = finalState.connections[0];
          
          console.log('Debug info:');
          console.log('- Connection ID:', connection.id);
          console.log('- Connection selected:', connection.isSelected);
          console.log('- Selected connection ID:', finalState.selectedConnectionId);
          console.log('- Connection count:', finalState.connections.length);
          console.log('- Node count:', finalState.nodes.length);
          
          // Check if handles should be rendered
          const shouldRenderHandles = connection.isSelected;
          console.log('- Should render handles:', shouldRenderHandles);
          
          if (shouldRenderHandles) {
            const nodeA = finalState.nodes[0];
            const nodeB = finalState.nodes[1];
            
            if (nodeA && nodeB) {
              console.log('- Node A:', nodeA.text, nodeA.position);
              console.log('- Node B:', nodeB.text, nodeB.position);
              
              const startPoint = {
                x: nodeA.position.x + nodeA.size.width / 2,
                y: nodeA.position.y + nodeA.size.height / 2,
              };
              
              const endPoint = {
                x: nodeB.position.x + nodeB.size.width / 2,
                y: nodeB.position.y + nodeB.size.height / 2,
              };
              
              console.log('- Calculated start point:', startPoint);
              console.log('- Calculated end point:', endPoint);
            }
          }
          
          return {
            connectionSelected: connection.isSelected,
            shouldRenderHandles,
            connectionId: connection.id,
            selectedConnectionId: finalState.selectedConnectionId
          };
        }
      }
      
      return { error: 'Failed to setup' };
    });
    
    console.log('📊 Debug info result:', debugInfo);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find handles using DOM inspection
    const domInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'No canvas found' };
      
      // Try different ways to access Konva stage
      const stage = canvas._konva_stage || window.Konva?.stages?.[0];
      if (!stage) return { error: 'No Konva stage found' };
      
      // Find all circles and groups
      const allNodes = stage.find('Circle');
      const allGroups = stage.find('Group');
      
      console.log('Found circles:', allNodes.length);
      console.log('Found groups:', allGroups.length);
      
      const handleNodes = [];
      allNodes.forEach((node, index) => {
        const name = node.name();
        const position = { x: node.x(), y: node.y() };
        const radius = node.radius?.();
        const fill = node.fill();
        
        console.log(`Circle ${index}:`, { name, position, radius, fill });
        
        if (name && name.includes('handle')) {
          handleNodes.push({ name, position, radius, fill });
        }
      });
      
      const handleGroups = [];
      allGroups.forEach((group, index) => {
        const name = group.name();
        const position = { x: group.x(), y: group.y() };
        
        console.log(`Group ${index}:`, { name, position });
        
        if (name && name.includes('handle')) {
          handleGroups.push({ name, position });
        }
      });
      
      return {
        totalCircles: allNodes.length,
        totalGroups: allGroups.length,
        handleNodes,
        handleGroups
      };
    });
    
    console.log('📊 DOM inspection result:', JSON.stringify(domInfo, null, 2));
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'temp/debug-handles-rendering.png' });
    console.log('📸 Screenshot: debug-handles-rendering.png');
    
    console.log('\n🔍 Handle rendering debug completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugHandlesRendering().catch(console.error);