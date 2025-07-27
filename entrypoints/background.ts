export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // Listen for messages from popup
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openTabs') {
      // Handle async operation
      (async () => {
        try {
          const { urls } = message;
          console.log('Background: Opening tabs for URLs:', urls);
          
          let successCount = 0;
          const totalLinks = urls.length;
          
          for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            
            try {
              console.log(`Background: Opening tab ${i + 1}/${totalLinks}: ${url}`);
              
              const tab = await browser.tabs.create({
                url: url,
                active: false
              });
              
              console.log(`Background: Successfully created tab ${i + 1}:`, tab.id);
              successCount++;
              
              // Add delay between tab creations
              if (i < urls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
              }
            } catch (error) {
              console.error(`Background: Failed to open tab ${i + 1}:`, error);
            }
          }
          
          console.log(`Background: Opened ${successCount}/${totalLinks} tabs`);
          
          // Send response back to popup
          // Consider it successful only if all tabs opened
          const allTabsOpened = successCount === totalLinks;
          const response = { 
            success: allTabsOpened, 
            successCount, 
            totalLinks 
          };
          
          console.log('Background: Sending response:', response);
          sendResponse(response);
          
        } catch (error) {
          console.error('Background: Error opening tabs:', error);
          const errorResponse = { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
          console.log('Background: Sending error response:', errorResponse);
          sendResponse(errorResponse);
        }
      })();
      
      return true; // Keep message channel open for async response
    }
  });
});
