import browser from 'webextension-polyfill';
import { addVisitedLink, initializeVisitedLinksTracking } from './utils/visitedLinks';

export default defineBackground(() => {
  console.log('Background worker', { id: browser.runtime.id });

  // Initialize visited links tracking
  initializeVisitedLinksTracking();

  // Check if domain is excluded and update icon accordingly
  const checkDomainAndUpdateIcon = async (tabId: number, url: string) => {
    try {
      // Get settings from storage
      const result = await browser.storage.sync.get('settings');
      const settings = result.settings || {} as any;
      
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

  // Listen for messages from popup and content script
  browser.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
    if (message.action === 'openTabs') {
      // Handle async operation
      (async () => {
        try {
          const { urls, delay, openAtEnd } = message;
          console.log('Background: Opening tabs for URLs:', urls);
          console.log('Background: Using delay:', delay, 'seconds');
          console.log('Background: Open at end:', openAtEnd);
          
          let successCount = 0;
          const totalLinks = urls.length;
          
          // Get current tab count if opening at end
          let tabIndex = undefined;
          if (openAtEnd) {
            const currentTabs = await browser.tabs.query({ currentWindow: true });
            tabIndex = currentTabs.length;
          }
          
          for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            
            try {
              console.log(`Background: Opening tab ${i + 1}/${totalLinks}: ${url}`);
              
              const createOptions: any = {
                url: url,
                active: false
              };
              
              // Set index if opening at end
              if (openAtEnd && tabIndex !== undefined) {
                createOptions.index = tabIndex + i;
              }
              
              const tab = await browser.tabs.create(createOptions);
              
              // Track visited link in custom system
              await addVisitedLink(url);
              
              console.log(`Background: Successfully created tab ${i + 1}:`, tab.id);
              successCount++;
              
              // Apply delay between tab creations if specified
              if (delay && delay > 0 && i < urls.length - 1) {
                console.log(`Background: Waiting ${delay} seconds before next tab...`);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
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
    
    if (message.action === 'openWindow') {
      // Handle async operation for opening new window
      (async () => {
        try {
          const { urls, delay } = message;
          console.log('Background: Opening new window with URLs:', urls);
          console.log('Background: Using delay:', delay, 'seconds');
          
          if (urls.length === 0) {
            sendResponse({ success: false, error: 'No URLs provided' });
            return;
          }
          
          // Create new window with first URL
          const window = await browser.windows.create({
            url: urls[0],
            focused: true
          });
          
          // Track visited link in custom system
          await addVisitedLink(urls[0]);
          
          console.log('Background: Created new window:', window.id);
          
          // Add remaining URLs as tabs in the new window
          let successCount = 1; // First tab already created with window
          
          for (let i = 1; i < urls.length; i++) {
            try {
              console.log(`Background: Adding tab ${i + 1}/${urls.length}: ${urls[i]}`);
              
              const tab = await browser.tabs.create({
                url: urls[i],
                windowId: window.id,
                active: false
              });
              
              // Track visited link in custom system
              await addVisitedLink(urls[i]);
              
              console.log(`Background: Successfully created tab ${i + 1}:`, tab.id);
              successCount++;
              
              // Apply delay between tab creations if specified
              if (delay && delay > 0 && i < urls.length - 1) {
                console.log(`Background: Waiting ${delay} seconds before next tab...`);
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
              }
            } catch (error) {
              console.error(`Background: Failed to create tab ${i + 1}:`, error);
            }
          }
          
          console.log(`Background: Created window with ${successCount}/${urls.length} tabs`);
          
          const response = {
            success: true,
            successCount,
            totalLinks: urls.length,
            windowId: window.id
          };
          
          console.log('Background: Sending window response:', response);
          sendResponse(response);
          
        } catch (error) {
          console.error('Background: Error opening window:', error);
          const errorResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
          console.log('Background: Sending window error response:', errorResponse);
          sendResponse(errorResponse);
        }
      })();
      
      return true; // Keep message channel open for async response
    }
    
    return true; // Always return true for async message handling
  });
});
