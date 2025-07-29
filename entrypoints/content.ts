import browser from 'webextension-polyfill';

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
    
    // Create selection box element
    const createSelectionBox = (x: number, y: number, action: ActionConfig): HTMLDivElement => {
      const box = document.createElement('div');
      box.style.position = 'fixed';
      box.style.left = x + 'px';
      box.style.top = y + 'px';
      box.style.width = '0px';
      box.style.height = '0px';
      box.style.border = `${action.borderSize}px ${action.borderType} ${action.color}`;
      box.style.backgroundColor = action.color + '20'; // 20% opacity
      box.style.pointerEvents = 'none';
      box.style.zIndex = '999999';
      box.style.boxSizing = 'border-box';
      document.body.appendChild(box);
      return box;
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
        
        currentAction = matchingAction;
        isDragging = true;
        
        const startX = event.clientX;
        const startY = event.clientY;
        
        const box = createSelectionBox(startX, startY, matchingAction);
        selectionBox = {
          element: box,
          startX,
          startY,
          isActive: true
        };
        
        // Prevent default link behavior
        document.addEventListener('click', preventClick, true);
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging && selectionBox && currentAction) {
        event.preventDefault();
        
        updateSelectionBox(
          selectionBox.element,
          selectionBox.startX,
          selectionBox.startY,
          event.clientX,
          event.clientY
        );
        
        // Update selected links
        selectedLinks = getLinksInSelection(
          selectionBox.startX + window.scrollX,
          selectionBox.startY + window.scrollY,
          event.clientX + window.scrollX,
          event.clientY + window.scrollY
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
        
        // Remove highlights
        document.querySelectorAll('.grabbit-highlighted').forEach(el => {
          el.classList.remove('grabbit-highlighted');
        });
        
        // Reset state
        selectionBox = null;
        isDragging = false;
        currentAction = null;
        selectedLinks = [];
        
        // Remove click prevention after a short delay
        setTimeout(() => {
          document.removeEventListener('click', preventClick, true);
        }, 100);
        
        // Execute action after cleanup
        await executeAction(actionToExecute, linksToProcess);
      }
    };
    
    const preventClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    
    // Add CSS for highlighted links
    const addStyles = () => {
      const style = document.createElement('style');
      style.textContent = `
        .grabbit-highlighted {
          outline: 2px solid #667eea !important;
          outline-offset: 2px !important;
          background-color: rgba(102, 126, 234, 0.1) !important;
        }
      `;
      document.head.appendChild(style);
    };
    
    // Initialize
    const init = async () => {
      await loadActions();
      addStyles();
      
      // Add event listeners
      document.addEventListener('mousedown', handleMouseDown, true);
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('mouseup', handleMouseUp, true);
      
      // Prevent context menu when right-clicking with actions
      document.addEventListener('contextmenu', (event) => {
        if (isDragging) {
          event.preventDefault();
        }
      });
      
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
  },
});
