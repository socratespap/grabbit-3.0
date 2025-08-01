import browser from 'webextension-polyfill';
import { initializeVisitedLinksStyler, updateVisitedLinksStyles } from './utils/visitedLinksStyler';
import { addVisitedLink } from './utils/visitedLinks';

interface ActionConfig {
  id: string;
  mouseButton: string;
  modifiers: string[];
  color: string;
  borderType: string;
  borderSize: number;
  action: string;
  advancedOptions: any;
  createdAt: Date;
}

interface SelectionBox {
  element: HTMLDivElement;
  statusElement: HTMLDivElement;
  startX: number;
  startY: number;
  isActive: boolean;
}

interface MessageResponse {
  success: boolean;
  successCount?: number;
  error?: string;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Grabbit content script loaded');
    
    let actions: ActionConfig[] = [];
    let selectionBox: SelectionBox | null = null;
    let isDragging = false;
    let currentAction: ActionConfig | null = null;
    let selectedLinks: HTMLAnchorElement[] = [];
    let actionActivated = false; // Flag to prevent duplicate activation
    
    // Load actions from storage
    const loadActions = async () => {
      try {
        const result = await browser.storage.sync.get('grabbitActions');
        const loadedActions = result.grabbitActions;
        
        if (Array.isArray(loadedActions)) {
          actions = loadedActions.map(action => ({
            ...action,
            modifiers: Array.isArray(action.modifiers) ? action.modifiers : 
                      (action.modifiers && typeof action.modifiers === 'object') ? 
                      Object.values(action.modifiers) : [],
            createdAt: typeof action.createdAt === 'string' ? new Date(action.createdAt) : action.createdAt
          }));
        } else {
          actions = [];
        }
        
        console.log('Loaded actions:', actions);
      } catch (error) {
        console.error('Error loading actions:', error);
      }
    };
    
    // Generate status text based on action and link count
    const getStatusText = (action: ActionConfig, linkCount: number): string => {
      if (linkCount === 0) {
        return 'No links selected';
      }
      
      const linkText = linkCount === 1 ? 'link' : 'links';
      
      switch (action.action) {
        case 'open_new_tab':
          return `${linkCount} ${linkText} will open in new tabs`;
        case 'open_new_window':
          return `${linkCount} ${linkText} will open in a new window`;
        case 'copy_urls':
          return `${linkCount} ${linkText} will be copied as URLs`;
        case 'copy_urls_with_title':
          const options = action.advancedOptions?.copy_urls_with_title || {};
          const format = options.formatPattern === 'json' ? 'JSON format' : 
                        options.formatPattern === 'markdown' ? 'Markdown format' : 
                        options.formatPattern === 'html' ? 'HTML format' : 'text format';
          return `${linkCount} ${linkText} with titles will be copied in ${format}`;
        case 'copy_titles':
          return `${linkCount} ${linkText} titles will be copied`;
        default:
          return `${linkCount} ${linkText} selected`;
      }
    };
    
    // Create selection box element
    const createSelectionBox = (x: number, y: number, action: ActionConfig): HTMLDivElement => {
      const box = document.createElement('div');
      box.style.position = 'absolute';
      box.style.left = x + 'px';
      box.style.top = y + 'px';
      box.style.width = '0px';
      box.style.height = '0px';
      box.style.border = `${action.borderSize}px ${action.borderType} ${action.color}`;
      box.style.backgroundColor = 'transparent';
      box.style.pointerEvents = 'none';
      box.style.zIndex = '10000';
      box.style.boxSizing = 'border-box';
      
      document.body.appendChild(box);
      return box;
    };
    
    // Create status display element
    const createStatusElement = (action: ActionConfig): HTMLDivElement => {
      const statusElement = document.createElement('div');
      statusElement.style.position = 'absolute';
      statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      statusElement.style.color = 'white';
      statusElement.style.padding = '6px 12px';
      statusElement.style.borderRadius = '4px';
      statusElement.style.fontSize = '12px';
      statusElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      statusElement.style.whiteSpace = 'nowrap';
      statusElement.style.pointerEvents = 'none';
      statusElement.style.zIndex = '10001';
      statusElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      statusElement.textContent = getStatusText(action, 0);
      
      document.body.appendChild(statusElement);
      return statusElement;
    };
    
    // Update selection box size
    const updateSelectionBox = (box: HTMLDivElement, startX: number, startY: number, currentX: number, currentY: number) => {
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      
      box.style.left = left + 'px';
      box.style.top = top + 'px';
      box.style.width = width + 'px';
      box.style.height = height + 'px';
      
      // Update status element position and text
      if (selectionBox && selectionBox.statusElement && currentAction) {
        selectionBox.statusElement.style.left = (left + 10) + 'px';
        selectionBox.statusElement.style.top = (top - 30) + 'px';
        
        // Get current links in selection and update status text
        const links = getLinksInSelection(left, top, left + width, top + height);
        selectionBox.statusElement.textContent = getStatusText(currentAction, links.length);
      }
    };
    
    // Get links within selection box
    const getLinksInSelection = (startX: number, startY: number, endX: number, endY: number): HTMLAnchorElement[] => {
      const links = document.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
      const selectedLinks: HTMLAnchorElement[] = [];
      
      const selectionRect = {
        left: Math.min(startX, endX),
        top: Math.min(startY, endY),
        right: Math.max(startX, endX),
        bottom: Math.max(startY, endY)
      };
      
      links.forEach(link => {
        // Check if the link or any of its parents are sticky/fixed positioned
        let element: Element | null = link;
        let isSticky = false;
        
        while (element && element !== document.body) {
          const computedStyle = window.getComputedStyle(element);
          const position = computedStyle.position;
          
          if (position === 'fixed' || position === 'sticky') {
            isSticky = true;
            break;
          }
          
          element = element.parentElement;
        }
        
        // Skip sticky/fixed elements
        if (isSticky) {
          return;
        }
        
        const rect = link.getBoundingClientRect();
        const linkRect = {
          left: rect.left + window.scrollX,
          top: rect.top + window.scrollY,
          right: rect.right + window.scrollX,
          bottom: rect.bottom + window.scrollY
        };
        
        // Check if link intersects with selection
        if (linkRect.left < selectionRect.right &&
            linkRect.right > selectionRect.left &&
            linkRect.top < selectionRect.bottom &&
            linkRect.bottom > selectionRect.top) {
          selectedLinks.push(link);
        }
      });
      
      return selectedLinks;
    };
    
    // Apply smart select (remove duplicates)
    const applySmartSelect = (links: HTMLAnchorElement[], smartSelectEnabled: boolean, actionType: string): HTMLAnchorElement[] => {
      if (!smartSelectEnabled) return links;
      
      const seen = new Set<string>();
      return links.filter(link => {
        let key: string;
        
        // For title-based actions, use title as the key
        if (actionType === 'copy_titles') {
          key = link.textContent?.trim() || link.title || 'Untitled';
        } else {
          // For URL-based actions, use URL as the key
          key = link.href;
        }
        
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    
    // Apply reverse order
    const applyReverseOrder = (items: any[], reverseOrderEnabled: boolean): any[] => {
      return reverseOrderEnabled ? [...items].reverse() : items;
    };
    
    // Get separator string
    const getSeparator = (separatorType: string, separatorCount: number = 1): string => {
      const separatorMap: Record<string, string> = {
        space: ' ',
        dash: '-',
        pipe: '|',
        colon: ':',
        tab: '\t',
        newline: '\n'
      };
      
      const separator = separatorMap[separatorType] || separatorMap.newline;
      return separator.repeat(separatorCount);
    };
    
    // Format URLs with titles based on pattern
    const formatUrlsWithTitles = (links: HTMLAnchorElement[], options: any): string => {
      const formatPattern = options.formatPattern || 'title_url';
      const separatorType = options.separatorType || 'space';
      const separatorCount = options.separatorCount || 1;
      const newLinesCount = options.newLinesCount || 0;
      
      const separator = getSeparator(separatorType, separatorCount);
      
      const formatEntry = (link: HTMLAnchorElement) => {
        const title = link.textContent?.trim() || link.title || 'Untitled';
        const url = link.href;
        
        switch (formatPattern) {
          case 'title_url':
            return `${title}${separator}${url}`;
          case 'url_title':
            return `${url}${separator}${title}`;
          case 'markdown':
            return `[${title}](${url})`;
          case 'html':
            return `<a href="${url}">${title}</a>`;
          case 'json':
            return { url, title };
          default:
            return `${title}${separator}${url}`;
        }
      };
      
      // Handle JSON format specially
      if (formatPattern === 'json') {
        const urlsArray = links.map(formatEntry);
        return JSON.stringify({ urls: urlsArray }, null, 2);
      }
      
      const formattedEntries = links.map(formatEntry);
      const newLines = '\n'.repeat((newLinesCount || 0) + 1);
      
      return formattedEntries.join(newLines);
    };
    
    // Execute action on selected links
    const executeAction = async (action: ActionConfig, links: HTMLAnchorElement[]) => {
      if (links.length === 0) return;
      
      console.log(`Executing action: ${action.action} on ${links.length} links`);
      
      switch (action.action) {
        case 'open_new_tab': {
          const options = action.advancedOptions?.open_new_tab || {};
          
          // Apply smart select and reverse order
          let processedLinks = applySmartSelect(links, options.smartSelectEnabled !== false, 'open_new_tab');
          processedLinks = applyReverseOrder(processedLinks, options.reverseOrderEnabled === true);
          
          const tabUrls = processedLinks.map(link => link.href).filter(url => url && url.startsWith('http'));
          
          if (tabUrls.length > 0) {
            try {
              const delay = options.tabOpeningDelay || 0;
              const response = await browser.runtime.sendMessage({
                action: 'openTabs',
                urls: tabUrls,
                delay: delay,
                openAtEnd: options.openAtEndEnabled === true
              }) as MessageResponse;
              
              if (response.success) {
                // Track visited links in custom system
                tabUrls.forEach(url => {
                  addVisitedLink(url);
                  updateVisitedLinksStyles(url);
                });
                
                showNotification(`Opened ${response.successCount} tabs`);
              } else {
                console.error('Failed to open tabs:', response.error);
                showNotification(`Failed to open tabs: ${response.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error sending message to background:', error);
              showNotification('Failed to open tabs');
            }
          }
          break;
        }
          
        case 'open_new_window': {
          const options = action.advancedOptions?.open_new_window || {};
          
          // Apply smart select and reverse order
          let processedLinks = applySmartSelect(links, options.smartSelectEnabled !== false, 'open_new_window');
          processedLinks = applyReverseOrder(processedLinks, options.reverseOrderEnabled === true);
          
          const windowUrls = processedLinks.map(link => link.href).filter(url => url && url.startsWith('http'));
          
          if (windowUrls.length > 0) {
            try {
              const delay = options.tabOpeningDelay || 0;
              const response = await browser.runtime.sendMessage({
                action: 'openWindow',
                urls: windowUrls,
                delay: delay
              }) as MessageResponse;
              
              if (response.success) {
                // Track visited links in custom system
                windowUrls.forEach(url => {
                  addVisitedLink(url);
                  updateVisitedLinksStyles(url);
                });
                
                showNotification(`Opened new window with ${windowUrls.length} tabs`);
              } else {
                console.error('Failed to open window:', response.error);
                showNotification(`Failed to open window: ${response.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error sending message to background:', error);
              showNotification('Failed to open window');
            }
          }
          break;
        }
          
        case 'copy_urls': {
          const options = action.advancedOptions?.copy_urls || {};
          
          // Apply smart select and reverse order
          let processedLinks = applySmartSelect(links, options.smartSelectEnabled !== false, 'copy_urls');
          processedLinks = applyReverseOrder(processedLinks, options.reverseOrderEnabled === true);
          
          const urlList = processedLinks.map(link => link.href).filter(url => url && url.startsWith('http'));
          
          if (urlList.length > 0) {
            const text = urlList.join('\n');
            await navigator.clipboard.writeText(text);
            showNotification(`Copied ${urlList.length} URLs to clipboard`);
          }
          break;
        }
          
        case 'copy_urls_with_title': {
          const options = action.advancedOptions?.copy_urls_with_title || {};
          
          // Apply smart select and reverse order
          let processedLinks = applySmartSelect(links, options.smartSelectEnabled !== false, 'copy_urls_with_title');
          processedLinks = applyReverseOrder(processedLinks, options.reverseOrderEnabled === true);
          
          const validLinks = processedLinks.filter(link => link.href && link.href.startsWith('http'));
          
          if (validLinks.length > 0) {
            const text = formatUrlsWithTitles(validLinks, options);
            await navigator.clipboard.writeText(text);
            showNotification(`Copied ${validLinks.length} URLs with titles to clipboard`);
          }
          break;
        }
          
        case 'copy_titles': {
          const options = action.advancedOptions?.copy_titles || {};
          
          // Apply smart select and reverse order
          let processedLinks = applySmartSelect(links, options.smartSelectEnabled !== false, 'copy_titles');
          processedLinks = applyReverseOrder(processedLinks, options.reverseOrderEnabled === true);
          
          const titles = processedLinks
            .filter(link => link.href && link.href.startsWith('http'))
            .map(link => link.textContent?.trim() || link.title || 'Untitled');
          
          if (titles.length > 0) {
            const text = titles.join('\n');
            await navigator.clipboard.writeText(text);
            showNotification(`Copied ${titles.length} titles to clipboard`);
          }
          break;
        }
      }
    };
    
    // Show notification
    const showNotification = (message: string) => {
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.background = '#4CAF50';
      notification.style.color = 'white';
      notification.style.padding = '12px 20px';
      notification.style.borderRadius = '6px';
      notification.style.zIndex = '1000000';
      notification.style.fontSize = '14px';
      notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      notification.style.transition = 'all 0.3s ease';
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    };
    
    // Check if modifiers match
    const checkModifiers = (event: MouseEvent, requiredModifiers: string[]): boolean => {
      const activeModifiers: string[] = [];
      if (event.ctrlKey) activeModifiers.push('ctrl');
      if (event.shiftKey) activeModifiers.push('shift');
      if (event.altKey) activeModifiers.push('alt');
      if (event.metaKey) activeModifiers.push('meta');
      
      return requiredModifiers.length === activeModifiers.length &&
             requiredModifiers.every(mod => activeModifiers.includes(mod));
    };
    
    // Mouse event handlers
    let mouseDownTimeout: number | null = null;
    let hasMouseMoved = false;
    let pendingAction: ActionConfig | null = null;
    let mouseDownPosition = { x: 0, y: 0 };
    
    const handleMouseDown = (event: MouseEvent) => {
      // Find matching action
      const matchingAction = actions.find(action => {
        const buttonMatch = (action.mouseButton === 'left' && event.button === 0) ||
                           (action.mouseButton === 'right' && event.button === 2) ||
                           (action.mouseButton === 'middle' && event.button === 1);
        
        const modifiersMatch = checkModifiers(event, action.modifiers);
        
        return buttonMatch && modifiersMatch;
      });
      
      if (matchingAction) {
        event.preventDefault();
        event.stopPropagation();
        
        // Store the pending action and mouse position (convert to document coordinates)
        pendingAction = matchingAction;
        mouseDownPosition = { x: event.clientX, y: event.clientY + window.scrollY };
        hasMouseMoved = false;
        actionActivated = false;
        
        // Set a delay before activating the action
        mouseDownTimeout = window.setTimeout(() => {
          if (pendingAction && !hasMouseMoved) {
            // If no movement after delay, activate immediately
            activateAction(pendingAction, mouseDownPosition.x, mouseDownPosition.y);
          }
        }, 150); // 150ms delay
        
        // Prevent default link behavior
        document.addEventListener('click', preventClick, true);
      }
    };
    
    const activateAction = (action: ActionConfig, startX: number, startY: number) => {
      if (actionActivated) return; // Prevent duplicate activation
      actionActivated = true;
      
      currentAction = action;
      isDragging = true;
      
      // Update highlight color to match action color
      updateHighlightColor(action.color);
      
      const box = createSelectionBox(startX, startY, action);
      const statusElement = createStatusElement(action);
      
      // Position status element near the selection box
      statusElement.style.left = (startX + 10) + 'px';
      statusElement.style.top = (startY - 30) + 'px';
      
      selectionBox = {
        element: box,
        statusElement: statusElement,
        startX,
        startY,
        isActive: true
      };
      
      // Prevent context menu from appearing when action is activated
      document.addEventListener('contextmenu', preventContextMenu, true);
    };
    
    // Auto-scroll variables
    let autoScrollInterval: number | null = null;
    const SCROLL_ZONE_HEIGHT = 50; // pixels from bottom to trigger scroll
    const SCROLL_SPEED = 25; // pixels per scroll step
    const SCROLL_INTERVAL = 16; // milliseconds between scroll steps (~60fps)
    
    const startAutoScrollDown = () => {
      if (autoScrollInterval) return; // Already scrolling
      
      autoScrollInterval = window.setInterval(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY < maxScroll) {
          window.scrollBy(0, SCROLL_SPEED);
        } else {
          stopAutoScroll(); // Stop when reached bottom
        }
      }, SCROLL_INTERVAL);
    };
    
    const startAutoScrollUp = () => {
      if (autoScrollInterval) return; // Already scrolling
      
      autoScrollInterval = window.setInterval(() => {
        if (window.scrollY > 0) {
          window.scrollBy(0, -SCROLL_SPEED);
        } else {
          stopAutoScroll(); // Stop when reached top
        }
      }, SCROLL_INTERVAL);
    };
    
    const stopAutoScroll = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      // Check if we have a pending action and mouse has moved
      if (pendingAction && !hasMouseMoved && !actionActivated) {
        const currentDocumentY = event.clientY + window.scrollY;
        const deltaX = Math.abs(event.clientX - mouseDownPosition.x);
        const deltaY = Math.abs(currentDocumentY - mouseDownPosition.y);
        
        // If mouse moved more than 10 pixels, consider it movement
        if (deltaX > 10 || deltaY > 10) {
          hasMouseMoved = true;
          
          // Clear the timeout since we're activating due to movement
          if (mouseDownTimeout) {
            clearTimeout(mouseDownTimeout);
            mouseDownTimeout = null;
          }
          
          // Activate the action immediately when movement is detected
          activateAction(pendingAction, mouseDownPosition.x, mouseDownPosition.y);
          pendingAction = null;
        }
      }
      
      if (isDragging && selectionBox && currentAction) {
        event.preventDefault();
        
        const currentDocumentX = event.clientX;
        const currentDocumentY = event.clientY + window.scrollY;
        
        // Auto-scroll when mouse is near top or bottom of viewport
        const viewportHeight = window.innerHeight;
        const mouseY = event.clientY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        
        if (mouseY < SCROLL_ZONE_HEIGHT && window.scrollY > 0) {
          // Scroll up when mouse is near top
          startAutoScrollUp();
        } else if (mouseY > viewportHeight - SCROLL_ZONE_HEIGHT && window.scrollY < maxScroll) {
          // Scroll down when mouse is near bottom
          startAutoScrollDown();
        } else {
          stopAutoScroll();
        }
        
        updateSelectionBox(
          selectionBox.element,
          selectionBox.startX,
          selectionBox.startY,
          currentDocumentX,
          currentDocumentY
        );
        
        // Update selected links
        selectedLinks = getLinksInSelection(
          selectionBox.startX,
          selectionBox.startY,
          currentDocumentX,
          currentDocumentY
        );
        
        // Highlight selected links
        document.querySelectorAll('.grabbit-highlighted').forEach(el => {
          el.classList.remove('grabbit-highlighted');
        });
        
        selectedLinks.forEach(link => {
          link.classList.add('grabbit-highlighted');
        });
      }
    };
    
    const handleMouseUp = async (event: MouseEvent) => {
      // Clear any pending timeout
      if (mouseDownTimeout) {
        clearTimeout(mouseDownTimeout);
        mouseDownTimeout = null;
      }
      
      // Stop auto-scrolling
      stopAutoScroll();
      
      // Reset pending action state
      if (pendingAction && !isDragging) {
        pendingAction = null;
        hasMouseMoved = false;
        // Remove click prevention and context menu prevention after a short delay
        setTimeout(() => {
          document.removeEventListener('click', preventClick, true);
          document.removeEventListener('contextmenu', preventContextMenu, true);
        }, 100);
        return;
      }
      
      if (isDragging && selectionBox && currentAction) {
        event.preventDefault();
        event.stopPropagation();
        
        // Store references before cleanup
        const actionToExecute = currentAction;
        const linksToProcess = [...selectedLinks];
        
        // Immediate cleanup for better UX
        if (selectionBox.element.parentNode) {
          selectionBox.element.parentNode.removeChild(selectionBox.element);
        }
        if (selectionBox.statusElement && selectionBox.statusElement.parentNode) {
          selectionBox.statusElement.parentNode.removeChild(selectionBox.statusElement);
        }
        
        // Remove highlights
        document.querySelectorAll('.grabbit-highlighted').forEach(el => {
          el.classList.remove('grabbit-highlighted');
        });
        
        // Reset state
        selectionBox = null;
        isDragging = false;
        currentAction = null;
        selectedLinks = [];
        pendingAction = null;
        hasMouseMoved = false;
        actionActivated = false;
        
        // Clean up dynamic styles
        if (dynamicStyleElement && dynamicStyleElement.parentNode) {
          dynamicStyleElement.parentNode.removeChild(dynamicStyleElement);
          dynamicStyleElement = null;
        }
        
        // Remove click prevention and context menu prevention after a short delay
        setTimeout(() => {
          document.removeEventListener('click', preventClick, true);
          document.removeEventListener('contextmenu', preventContextMenu, true);
        }, 100);
        
        // Execute action after cleanup
        await executeAction(actionToExecute, linksToProcess);
      }
    };
    
    const preventClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    
    const preventContextMenu = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    
    const getCurrentModifiers = (event: KeyboardEvent | MouseEvent) => {
      const modifiers: string[] = [];
      if (event.ctrlKey) modifiers.push('ctrl');
      if (event.shiftKey) modifiers.push('shift');
      if (event.altKey) modifiers.push('alt');
      if (event.metaKey) modifiers.push('meta');
      return modifiers;
    };
    
    const findMatchingAction = (mouseButton: string, modifiers: string[]) => {
      return actions.find(action => 
        action.mouseButton === mouseButton && 
        JSON.stringify(action.modifiers.sort()) === JSON.stringify(modifiers.sort())
      );
    };
    
    const switchToAction = (newAction: ActionConfig) => {
      if (!selectionBox || !currentAction) return;
      
      console.log(`Switching from ${currentAction.action} to ${newAction.action}`);
      
      // Update current action
      currentAction = newAction;
      
      // Update selection box appearance
      const box = selectionBox.element;
      box.style.borderColor = newAction.color;
      box.style.backgroundColor = `${newAction.color}20`;
      
      // Update highlight color
      updateHighlightColor(newAction.color);
      
      // Update status element text with new action
      if (selectionBox.statusElement) {
        selectionBox.statusElement.textContent = getStatusText(newAction, selectedLinks.length);
      }
      
      // Re-highlight selected links with new color
      selectedLinks.forEach(link => {
        link.classList.add('grabbit-highlighted');
      });
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle escape key to cancel active actions
      if (event.key === 'Escape' || event.keyCode === 27) {
        // Check if we have any active Grabbit actions
        const hasActiveAction = isDragging || pendingAction || mouseDownTimeout;
        
        if (hasActiveAction) {
          // Prevent system shortcuts (like Windows menu) when canceling our actions
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          
          // Stop auto-scrolling
          stopAutoScroll();
          
          // Cancel any pending timeout
          if (mouseDownTimeout) {
            clearTimeout(mouseDownTimeout);
            mouseDownTimeout = null;
          }
          
          // Clean up active selection
          if (isDragging && selectionBox) {
            if (selectionBox.element.parentNode) {
              selectionBox.element.parentNode.removeChild(selectionBox.element);
            }
            if (selectionBox.statusElement && selectionBox.statusElement.parentNode) {
              selectionBox.statusElement.parentNode.removeChild(selectionBox.statusElement);
            }
            
            // Remove highlights
            document.querySelectorAll('.grabbit-highlighted').forEach(el => {
              el.classList.remove('grabbit-highlighted');
            });
          }
          
          // Reset all state
          selectionBox = null;
          isDragging = false;
          currentAction = null;
          selectedLinks = [];
          pendingAction = null;
          hasMouseMoved = false;
          actionActivated = false;
          
          // Clean up dynamic styles
          if (dynamicStyleElement && dynamicStyleElement.parentNode) {
            dynamicStyleElement.parentNode.removeChild(dynamicStyleElement);
            dynamicStyleElement = null;
          }
          
          // Remove event listeners
          document.removeEventListener('click', preventClick, true);
          document.removeEventListener('contextmenu', preventContextMenu, true);
          
          console.log('Grabbit action canceled by escape key');
        }
      } else if (isDragging && currentAction && ['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
        // Handle modifier key changes during active selection
        const currentModifiers = getCurrentModifiers(event);
        const matchingAction = findMatchingAction(currentAction.mouseButton, currentModifiers);
        
        if (matchingAction && matchingAction.id !== currentAction.id) {
          switchToAction(matchingAction);
        }
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      if (isDragging && currentAction && ['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
        // Handle modifier key release during active selection
        const currentModifiers = getCurrentModifiers(event);
        const matchingAction = findMatchingAction(currentAction.mouseButton, currentModifiers);
        
        if (matchingAction && matchingAction.id !== currentAction.id) {
          switchToAction(matchingAction);
        }
      }
    };
    
    const handleScroll = () => {
      // The selection box uses absolute positioning with document coordinates,
      // so it automatically moves with the page content during scrolling.
      // We just need to update the link highlighting since link positions
      // change relative to the viewport during scroll.
      if (isDragging && selectionBox) {
        // Remove old highlights
        document.querySelectorAll('.grabbit-highlighted').forEach(el => {
          el.classList.remove('grabbit-highlighted');
        });
        
        // Get current selection box dimensions to recalculate selected links
        const box = selectionBox.element;
        const left = parseInt(box.style.left);
        const top = parseInt(box.style.top);
        const width = parseInt(box.style.width);
        const height = parseInt(box.style.height);
        
        // Calculate end coordinates
        const endX = left + width;
        const endY = top + height;
        
        // Update selected links with current selection area
        selectedLinks = getLinksInSelection(left, top, endX, endY);
        selectedLinks.forEach(link => {
          link.classList.add('grabbit-highlighted');
        });
      }
    };
    
    // Add CSS for highlighted links
    let dynamicStyleElement: HTMLStyleElement | null = null;
    
    const addStyles = () => {
      // Create base styles that don't change
      const baseStyle = document.createElement('style');
      baseStyle.textContent = `
        .grabbit-highlighted {
          outline-offset: 2px !important;
        }
      `;
      document.head.appendChild(baseStyle);
    };
    
    const updateHighlightColor = (color: string) => {
      // Remove existing dynamic style
      if (dynamicStyleElement && dynamicStyleElement.parentNode) {
        dynamicStyleElement.parentNode.removeChild(dynamicStyleElement);
      }
      
      // Create new dynamic style with action color
      dynamicStyleElement = document.createElement('style');
      
      // Convert hex to rgba for background
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      
      dynamicStyleElement.textContent = `
        .grabbit-highlighted {
          outline: 2px solid ${color} !important;
          background-color: ${hexToRgba(color, 0.1)} !important;
        }
      `;
      document.head.appendChild(dynamicStyleElement);
    };
    
    // Initialize
    const init = async () => {
      await loadActions();
      addStyles();
      
      // Add event listeners
      document.addEventListener('mousedown', handleMouseDown, true);
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('mouseup', handleMouseUp, true);
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('keyup', handleKeyUp, true);
      document.addEventListener('scroll', handleScroll, true);
      
      // Note: Context menu prevention is now handled dynamically in activateAction
      
      // Listen for storage changes
       browser.storage.onChanged.addListener((changes, areaName) => {
         if (areaName === 'sync' && changes.grabbitActions) {
           const newActions = changes.grabbitActions.newValue;
           
           if (Array.isArray(newActions)) {
             actions = newActions.map(action => ({
               ...action,
               modifiers: Array.isArray(action.modifiers) ? action.modifiers : 
                         (action.modifiers && typeof action.modifiers === 'object') ? 
                         Object.values(action.modifiers) : [],
               createdAt: typeof action.createdAt === 'string' ? new Date(action.createdAt) : action.createdAt
             }));
           } else {
             actions = [];
           }
           
           console.log('Actions updated:', actions);
         }
       });
    };
    
    // Start the extension
    init();
    
    // Initialize visited links styling
    initializeVisitedLinksStyler();
  },
});
