import browser from 'webextension-polyfill';
import { getVisitedLinks } from './visitedLinks';

/**
 * Inject CSS to style visited links based on custom tracking
 */
export async function applyVisitedLinksStyles(): Promise<void> {
  try {
    const visitedUrls = await getVisitedLinks();
    
    if (visitedUrls.length === 0) {
      return;
    }
    
    // Create CSS selectors for visited links
    const selectors = visitedUrls.map(url => {
      // Escape special characters in URL for CSS selector
      const escapedUrl = url.replace(/["\\]/g, '\\$&');
      return `a[href="${escapedUrl}"]`;
    }).join(', ');
    
    // Create CSS rule to style visited links
    const css = `
      ${selectors} {
        color: #551A8B !important; /* Purple color for visited links */
      }
    `;
    
    // Remove existing style if present
    const existingStyle = document.getElementById('grabbit-visited-links-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Inject new style
    const style = document.createElement('style');
    style.id = 'grabbit-visited-links-style';
    style.textContent = css;
    document.head.appendChild(style);
    
    console.log(`Applied visited link styles for ${visitedUrls.length} URLs`);
  } catch (error) {
    console.error('Error applying visited links styles:', error);
  }
}

/**
 * Initialize visited links styling on page load
 */
export function initializeVisitedLinksStyler(): void {
  // Apply styles when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyVisitedLinksStyles);
  } else {
    applyVisitedLinksStyles();
  }
  
  // Reapply styles when new content is added (for dynamic pages)
  const observer = new MutationObserver((mutations) => {
    let hasNewLinks = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'A' || element.querySelector('a')) {
              hasNewLinks = true;
            }
          }
        });
      }
    });
    
    if (hasNewLinks) {
      // Debounce the style application
      clearTimeout((window as any).grabbitStyleTimeout);
      (window as any).grabbitStyleTimeout = setTimeout(applyVisitedLinksStyles, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Update visited links styles when a new link is visited
 */
export async function updateVisitedLinksStyles(newUrl: string): Promise<void> {
  try {
    // Escape special characters in URL for CSS selector
    const escapedUrl = newUrl.replace(/["\\]/g, '\\$&');
    const selector = `a[href="${escapedUrl}"]`;
    
    // Create CSS rule for the new visited link
    const css = `
      ${selector} {
        color: #551A8B !important; /* Purple color for visited links */
      }
    `;
    
    // Get or create style element
    let style = document.getElementById('grabbit-visited-links-style') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = 'grabbit-visited-links-style';
      document.head.appendChild(style);
    }
    
    // Append new CSS rule
    style.textContent += css;
    
    console.log(`Updated visited link style for: ${newUrl}`);
  } catch (error) {
    console.error('Error updating visited link style:', error);
  }
}