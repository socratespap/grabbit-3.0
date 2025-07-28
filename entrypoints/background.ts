export default defineBackground(() => {
  console.log('Background worker', { id: browser.runtime.id });

  // Check if domain is excluded and update icon accordingly
  const checkDomainAndUpdateIcon = async (tabId: number, url: string) => {
    try {
      // Get settings from storage
      const result = await browser.storage.sync.get('settings');
      const settings = result.settings || {};
      
      if (settings.excludedDomains) {
        const excludedDomains = settings.excludedDomains
          .split(',')
          .map((domain: string) => domain.trim())
          .filter((domain: string) => domain.length > 0);
        
        const currentDomain = new URL(url).hostname;
        const isExcluded = excludedDomains.some((excludedDomain: string) => 
          currentDomain === excludedDomain || currentDomain.endsWith('.' + excludedDomain)
        );
        
        if (isExcluded) {
          // Disable the extension action for excluded domains
          await browser.action.disable(tabId);
          
          // Set a badge to indicate disabled state
          await browser.action.setBadgeText({
            tabId: tabId,
            text: '✕'
          });
          
          await browser.action.setBadgeBackgroundColor({
            tabId: tabId,
            color: '#888888'
          });
          
          // Disable the popup
          await browser.action.setPopup({
            tabId: tabId,
            popup: ''
          });
        } else {
          // Enable the extension action
          await browser.action.enable(tabId);
          
          // Clear the badge
          await browser.action.setBadgeText({
            tabId: tabId,
            text: ''
          });
          
          // Enable the popup
          await browser.action.setPopup({
            tabId: tabId,
            popup: 'popup.html'
          });
        }
      }
    } catch (error) {
      console.error('Error checking domain exclusion:', error);
    }
  };

  // Listen for tab updates to check domain exclusions
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      await checkDomainAndUpdateIcon(tabId, tab.url);
    }
  });

  // Listen for tab activation to check domain exclusions
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await browser.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await checkDomainAndUpdateIcon(activeInfo.tabId, tab.url);
    }
  });

  // Listen for settings updates to refresh icon states
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'sync' && changes.settings) {
      // Settings changed, update all tabs
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url) {
          await checkDomainAndUpdateIcon(tab.id, tab.url);
        }
      }
    }
  });

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
