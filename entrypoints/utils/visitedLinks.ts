import browser from 'webextension-polyfill';

interface VisitedLink {
  url: string;
  timestamp: number;
}

const CLEANUP_INTERVAL = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
const STORAGE_KEY = 'grabbit_visited_links';

/**
 * Add a URL to the custom visited links tracking
 */
export async function addVisitedLink(url: string): Promise<void> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const visitedLinks: VisitedLink[] = (result[STORAGE_KEY] as VisitedLink[]) || [];
    
    // Check if URL already exists
    const existingIndex = visitedLinks.findIndex(link => link.url === url);
    
    if (existingIndex !== -1) {
      // Update timestamp if URL already exists
      visitedLinks[existingIndex].timestamp = Date.now();
    } else {
      // Add new URL
      visitedLinks.push({
        url: url,
        timestamp: Date.now()
      });
    }
    
    await browser.storage.local.set({ [STORAGE_KEY]: visitedLinks });
    console.log(`Visited link tracked: ${url}`);
  } catch (error) {
    console.error('Error adding visited link:', error);
  }
}

/**
 * Check if a URL has been visited through the extension
 */
export async function isLinkVisited(url: string): Promise<boolean> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const visitedLinks: VisitedLink[] = (result[STORAGE_KEY] as VisitedLink[]) || [];
    
    return visitedLinks.some(link => link.url === url);
  } catch (error) {
    console.error('Error checking visited link:', error);
    return false;
  }
}

/**
 * Get all visited links
 */
export async function getVisitedLinks(): Promise<string[]> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const visitedLinks: VisitedLink[] = (result[STORAGE_KEY] as VisitedLink[]) || [];
    
    return visitedLinks.map(link => link.url);
  } catch (error) {
    console.error('Error getting visited links:', error);
    return [];
  }
}

/**
 * Clean up visited links older than 48 hours
 */
export async function cleanupOldVisitedLinks(): Promise<void> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const visitedLinks: VisitedLink[] = (result[STORAGE_KEY] as VisitedLink[]) || [];
    
    const now = Date.now();
    const filteredLinks = visitedLinks.filter(link => {
      return (now - link.timestamp) < CLEANUP_INTERVAL;
    });
    
    if (filteredLinks.length !== visitedLinks.length) {
      await browser.storage.local.set({ [STORAGE_KEY]: filteredLinks });
      console.log(`Cleaned up ${visitedLinks.length - filteredLinks.length} old visited links`);
    }
  } catch (error) {
    console.error('Error cleaning up visited links:', error);
  }
}

/**
 * Initialize visited links tracking (call this on extension startup)
 */
export async function initializeVisitedLinksTracking(): Promise<void> {
  // Clean up old links on initialization
  await cleanupOldVisitedLinks();
  
  // Set up periodic cleanup every 6 hours
  setInterval(cleanupOldVisitedLinks, 6 * 60 * 60 * 1000);
}

/**
 * Clear all visited links (for testing or user preference)
 */
export async function clearAllVisitedLinks(): Promise<void> {
  try {
    await browser.storage.local.remove(STORAGE_KEY);
    console.log('All visited links cleared');
  } catch (error) {
    console.error('Error clearing visited links:', error);
  }
}