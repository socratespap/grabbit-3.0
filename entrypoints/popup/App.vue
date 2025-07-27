<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import browser from 'webextension-polyfill';

const extensionName = 'Grabbit';
const isLoading = ref(false);
const copySuccess = ref('');
const extensionVersion = ref('');
const lastCopiedUrls = ref<string[]>([]);
const linkCategories = ref<{[key: string]: string[]}>({});
const buttonStates = ref({
  copyAll: 'Copy All Tabs URLs',
  copySelected: 'Copy Selected Tabs URLs',
  openLinks: 'Open Copied Links'
});

// Settings from PopupOptions
const settings = ref({
  urlFormat: 'plain',
  includeTitle: false,
  sortOrder: 'tab-order',
  notifications: false,
  excludeLinks: false,
  excludedDomains: '',
  blankLines: 0,
  avoidDuplicates: true
});

// Computed property for open links button text
const openLinksButtonText = computed(() => {
  if (buttonStates.value.openLinks !== 'Open Copied Links') {
    return buttonStates.value.openLinks;
  }
  return lastCopiedUrls.value.length > 0 
    ? `Open Copied Links (${lastCopiedUrls.value.length})`
    : 'Open Copied Links';
});

// Load settings from storage
const loadSettings = async () => {
  try {
    if (browser.storage && browser.storage.sync) {
      const result = await browser.storage.sync.get('settings');
      if (result.settings) {
        settings.value = { ...settings.value, ...result.settings };
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

// Load copied URLs from storage
const loadCopiedUrls = async () => {
  try {
    if (browser.storage && browser.storage.local) {
      const result = await browser.storage.local.get('lastCopiedUrls');
      if (result.lastCopiedUrls && Array.isArray(result.lastCopiedUrls)) {
        lastCopiedUrls.value = result.lastCopiedUrls;
        linkCategories.value = categorizeUrls(result.lastCopiedUrls);
      }
    }
  } catch (error) {
    console.error('Error loading copied URLs:', error);
  }
};

// Save copied URLs to storage
const saveCopiedUrls = async (urls: string[]) => {
  try {
    if (browser.storage && browser.storage.local) {
      await browser.storage.local.set({ lastCopiedUrls: urls });
    }
  } catch (error) {
    console.error('Error saving copied URLs:', error);
  }
};

// Get extension version from manifest
onMounted(async () => {
  try {
    const manifest = browser.runtime.getManifest();
    extensionVersion.value = manifest.version;
    
    // Load settings and copied URLs
    await loadSettings();
    await loadCopiedUrls();
  } catch (error) {
    console.error('Error getting manifest:', error);
  }
});

// Check if URL should be excluded based on settings
const shouldExcludeUrl = (url: string): boolean => {
  if (!settings.value.excludeLinks || !settings.value.excludedDomains) {
    return false;
  }

  const excludedDomains = settings.value.excludedDomains
    .split('\n')
    .map(domain => domain.trim())
    .filter(domain => domain.length > 0);

  for (const excludePattern of excludedDomains) {
    try {
      // Handle wildcard patterns
      if (excludePattern.includes('*')) {
        const regex = new RegExp(excludePattern.replace(/\*/g, '.*'), 'i');
        if (regex.test(url)) {
          return true;
        }
      }
      // Handle exact domain matches
      else if (url.toLowerCase().includes(excludePattern.toLowerCase())) {
        return true;
      }
    } catch (error) {
      console.warn('Invalid exclude pattern:', excludePattern);
    }
  }

  return false;
};

// Format URLs according to settings
const formatUrls = async (tabs: browser.Tabs.Tab[]): Promise<string> => {
  let filteredTabs = tabs.filter(tab => tab.url && !shouldExcludeUrl(tab.url));
  
  // Remove duplicates if enabled
  if (settings.value.avoidDuplicates) {
    const seenUrls = new Set<string>();
    filteredTabs = filteredTabs.filter(tab => {
      if (tab.url && !seenUrls.has(tab.url)) {
        seenUrls.add(tab.url);
        return true;
      }
      return false;
    });
  }
  
  // Sort tabs according to settings
  if (settings.value.sortOrder === 'alphabetical') {
    filteredTabs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else if (settings.value.sortOrder === 'domain') {
    filteredTabs.sort((a, b) => {
      const domainA = a.url ? new URL(a.url).hostname : '';
      const domainB = b.url ? new URL(b.url).hostname : '';
      return domainA.localeCompare(domainB);
    });
  }
  // 'tab-order' keeps original order

  const formattedUrls: string[] = [];

  for (const tab of filteredTabs) {
    if (!tab.url) continue;

    const url = tab.url;
    const title = tab.title || 'Untitled';

    switch (settings.value.urlFormat) {
      case 'plain':
        if (settings.value.includeTitle) {
          formattedUrls.push(`${title} - ${url}`);
        } else {
          formattedUrls.push(url);
        }
        break;

      case 'markdown':
        if (settings.value.includeTitle) {
          formattedUrls.push(`[${title}](${url})`);
        } else {
          formattedUrls.push(`[${url}](${url})`);
        }
        break;

      case 'html':
        if (settings.value.includeTitle) {
          formattedUrls.push(`<a href="${url}">${title}</a>`);
        } else {
          formattedUrls.push(`<a href="${url}">${url}</a>`);
        }
        break;

      case 'json':
        // JSON format will be handled separately
        break;

      case 'csv':
        // CSV format will be handled separately
        break;

      default:
        formattedUrls.push(url);
    }
  }

  // Handle JSON format
  if (settings.value.urlFormat === 'json') {
    const jsonData = {
      urls: filteredTabs.map(tab => {
        const obj: any = { url: tab.url };
        if (settings.value.includeTitle) {
          obj.title = tab.title || 'Untitled';
        }
        return obj;
      })
    };
    return JSON.stringify(jsonData, null, 2);
  }

  // Handle CSV format
  if (settings.value.urlFormat === 'csv') {
    const csvLines: string[] = [];
    
    filteredTabs.forEach(tab => {
      if (settings.value.includeTitle) {
        const title = (tab.title || 'Untitled').replace(/\t/g, ' '); // Replace tabs with spaces
        csvLines.push(`${tab.url}\t${title}`);
      } else {
        csvLines.push(`${tab.url}`);
      }
    });
    
    // Add blank lines between CSV entries if specified
    if (settings.value.blankLines > 0) {
      const separator = '\n' + '\n'.repeat(settings.value.blankLines);
      return csvLines.join(separator);
    }
    
    return csvLines.join('\n');
  }

  // Add blank lines between formatted URLs if specified (not for JSON)
  if (settings.value.blankLines > 0) {
    const separator = '\n' + '\n'.repeat(settings.value.blankLines);
    return formattedUrls.join(separator);
  }

  return formattedUrls.join('\n');
};

// Show notification if enabled
const showNotification = (message: string, type?: string) => {
  if (settings.value.notifications) {
    // For popup, we'll just update the button text as notification
    // In a full extension, you might use browser.notifications.create()
    console.log('Notification:', message, type ? `(${type})` : '');
  }
};

// Categorize URLs by domain and type
const categorizeUrls = (urls: string[]) => {
  const categories: {[key: string]: string[]} = {
    social: [],
    shopping: [],
    news: [],
    development: [],
    entertainment: [],
    productivity: [],
    search: [],
    other: []
  };

  const socialDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'tiktok.com', 'youtube.com'];
  const shoppingDomains = ['amazon.com', 'ebay.com', 'shopify.com', 'etsy.com', 'alibaba.com', 'walmart.com'];
  const newsDomains = ['cnn.com', 'bbc.com', 'reuters.com', 'nytimes.com', 'theguardian.com', 'washingtonpost.com'];
  const devDomains = ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'codepen.io', 'gitlab.com', 'bitbucket.org'];
  const entertainmentDomains = ['netflix.com', 'spotify.com', 'twitch.tv', 'hulu.com', 'disney.com', 'primevideo.com'];
  const productivityDomains = ['google.com', 'microsoft.com', 'notion.so', 'slack.com', 'trello.com', 'asana.com'];
  const searchDomains = ['google.com/search', 'bing.com', 'duckduckgo.com', 'yahoo.com/search'];

  urls.forEach(url => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const fullUrl = url.toLowerCase();
      
      if (searchDomains.some(d => fullUrl.includes(d))) {
        categories.search.push(url);
      } else if (socialDomains.some(d => domain.includes(d))) {
        categories.social.push(url);
      } else if (shoppingDomains.some(d => domain.includes(d))) {
        categories.shopping.push(url);
      } else if (newsDomains.some(d => domain.includes(d))) {
        categories.news.push(url);
      } else if (devDomains.some(d => domain.includes(d))) {
        categories.development.push(url);
      } else if (entertainmentDomains.some(d => domain.includes(d))) {
        categories.entertainment.push(url);
      } else if (productivityDomains.some(d => domain.includes(d))) {
        categories.productivity.push(url);
      } else {
        categories.other.push(url);
      }
    } catch (error) {
      categories.other.push(url);
    }
  });

  return categories;
};

// Copy all tabs URLs
const copyAllTabsUrls = async () => {
  isLoading.value = true;
  buttonStates.value.copyAll = 'Copying...';
  
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    const validTabs = tabs.filter(tab => 
      tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('moz-extension://') &&
      !shouldExcludeUrl(tab.url)
    );
    
    if (validTabs.length === 0) {
      buttonStates.value.copyAll = '⚠ No valid URLs found';
      setTimeout(() => {
        buttonStates.value.copyAll = 'Copy All Tabs URLs';
      }, 2000);
      return;
    }
    
    const formattedContent = await formatUrls(validTabs);
    await navigator.clipboard.writeText(formattedContent);
    
    const urls = validTabs.map(tab => tab.url!);
    lastCopiedUrls.value = urls;
    linkCategories.value = categorizeUrls(urls);
    await saveCopiedUrls(urls);
    
    // Change button text temporarily
    buttonStates.value.copyAll = `✓ ${validTabs.length} tabs copied!`;
    
    showNotification(`Copied ${validTabs.length} URLs`);
    
    setTimeout(() => {
      buttonStates.value.copyAll = 'Copy All Tabs URLs';
    }, 2000);
  } catch (error) {
    console.error('Error copying all tabs:', error);
    buttonStates.value.copyAll = '✗ Error copying tabs';
    
    setTimeout(() => {
      buttonStates.value.copyAll = 'Copy All Tabs URLs';
    }, 2000);
  } finally {
    isLoading.value = false;
  }
};

// Copy selected tabs URLs
const copySelectedTabsUrls = async () => {
  isLoading.value = true;
  buttonStates.value.copySelected = 'Copying...';
  
  try {
    const tabs = await browser.tabs.query({ highlighted: true });
    let validTabs = tabs.filter(tab => 
      tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('moz-extension://') &&
      !shouldExcludeUrl(tab.url)
    );
    
    // Remove duplicates if enabled
    if (settings.value.avoidDuplicates) {
      const seenUrls = new Set<string>();
      validTabs = validTabs.filter(tab => {
        if (tab.url && !seenUrls.has(tab.url)) {
          seenUrls.add(tab.url);
          return true;
        }
        return false;
      });
    }
    
    if (validTabs.length === 0) {
      copySuccess.value = 'No valid selected tabs found';
      buttonStates.value.copySelected = '⚠ No tabs selected';
      setTimeout(() => {
        buttonStates.value.copySelected = 'Copy Selected Tabs URLs';
        copySuccess.value = '';
      }, 2000);
      return;
    }
    
    const formattedContent = await formatUrls(validTabs);
    await navigator.clipboard.writeText(formattedContent);
    
    const urls = validTabs.map(tab => tab.url!);
    lastCopiedUrls.value = urls;
    linkCategories.value = categorizeUrls(urls);
    await saveCopiedUrls(urls);
    
    copySuccess.value = `Copied ${validTabs.length} selected URLs to clipboard`;
    buttonStates.value.copySelected = '✓ Copied!';
    
    showNotification(`Copied ${validTabs.length} selected URLs`);
    
    setTimeout(() => {
      buttonStates.value.copySelected = 'Copy Selected Tabs URLs';
      copySuccess.value = '';
    }, 2000);
    
  } catch (error) {
    console.error('Error copying selected tabs:', error);
    copySuccess.value = 'Failed to copy selected URLs';
    buttonStates.value.copySelected = 'Copy Selected Tabs URLs';
  } finally {
    isLoading.value = false;
  }
};

// Open copied links with smart categorization
const openCopiedLinks = async () => {
  console.log('openCopiedLinks function called');
  console.log('lastCopiedUrls.value:', lastCopiedUrls.value);
  console.log('lastCopiedUrls.value.length:', lastCopiedUrls.value.length);
  
  if (lastCopiedUrls.value.length === 0) {
    buttonStates.value.openLinks = '⚠ No links to open. Copy tabs first!';
    setTimeout(() => {
      buttonStates.value.openLinks = 'Open Copied Links';
    }, 2000);
    return;
  }

  isLoading.value = true;
  
  try {
    // Filter out excluded URLs before opening
    let validUrls = lastCopiedUrls.value.filter(url => !shouldExcludeUrl(url));
    
    // Remove duplicates if enabled
    if (settings.value.avoidDuplicates) {
      const seenUrls = new Set<string>();
      validUrls = validUrls.filter(url => {
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          return true;
        }
        return false;
      });
    }
    
    if (validUrls.length === 0) {
      buttonStates.value.openLinks = '⚠ All URLs excluded';
      setTimeout(() => {
        buttonStates.value.openLinks = 'Open Copied Links';
      }, 2000);
      return;
    }
    
    const totalLinks = validUrls.length;
    buttonStates.value.openLinks = `Opening ${totalLinks} links...`;
    
    console.log('Sending message to background script to open tabs');
    
    // Send message to background script to open tabs
    const response = await browser.runtime.sendMessage({
      action: 'openTabs',
      urls: validUrls
    }) as { success: boolean; successCount?: number; totalLinks?: number; error?: string };
    
    console.log('Background script response:', response);
    
    if (response) {
      const { successCount, totalLinks: responseTotal, success } = response;
      
      // Show success message with null checks
      const successNum = successCount ?? 0;
      const totalNum = responseTotal ?? 0;
      
      if (successNum > 0) {
        // Show success for any tabs that opened
        if (success) {
          buttonStates.value.openLinks = `✓ Opened ${successNum}/${totalNum} links!`;
          showNotification(`Opened ${successNum} of ${totalNum} links`);
        } else {
          // Partial success
          buttonStates.value.openLinks = `⚠ Opened ${successNum}/${totalNum} links`;
          showNotification(`Opened ${successNum} of ${totalNum} links (some failed)`);
        }
        
        if (successNum < totalNum) {
          console.warn(`Only ${successNum} of ${totalNum} links were opened successfully`);
        }
      } else {
        // No tabs opened at all
        console.error('Background script error:', response?.error || 'No tabs could be opened');
        buttonStates.value.openLinks = '✗ Error opening links';
        showNotification('Failed to open any links');
      }
    } else {
      console.error('No response from background script');
      buttonStates.value.openLinks = '✗ Error opening links';
      showNotification('Failed to open links');
    }
    
    setTimeout(() => {
      buttonStates.value.openLinks = 'Open Copied Links';
    }, 2000);
  } catch (error) {
    console.error('Error sending message to background script:', error);
    buttonStates.value.openLinks = '✗ Error opening links';
    showNotification('Failed to open links');
    
    setTimeout(() => {
      buttonStates.value.openLinks = 'Open Copied Links';
    }, 2000);
  } finally {
    isLoading.value = false;
  }
};

const openMoreSettings = () => {
  browser.tabs.create({
    url: browser.runtime.getURL('options.html')
  });
};
</script>

<template>
  <div class="popup-container">
    <!-- Header -->
    <header class="header">
      <h1 class="extension-name">{{ extensionName }}</h1>
      <div class="logo">
        <img src="/icon/16.png" alt="Grabbit Logo" class="logo-icon" />
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Action Buttons -->
      <div class="action-buttons">
        <button 
          @click="copyAllTabsUrls" 
          :disabled="isLoading"
          class="action-btn primary"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {{ buttonStates.copyAll }}
        </button>

        <button 
          @click="copySelectedTabsUrls" 
          :disabled="isLoading"
          class="action-btn secondary"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {{ buttonStates.copySelected }}
        </button>

        <button 
            @click="openCopiedLinks"
            :disabled="isLoading || lastCopiedUrls.length === 0"
            class="action-btn tertiary"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {{ openLinksButtonText }}
          </button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <button @click="openMoreSettings" class="footer-btn">
        More Settings
      </button>
      <span class="version">v{{ extensionVersion }}</span>
    </footer>
  </div>
</template>

<style scoped>
.popup-container {
  width: 320px;
  min-height: 240px;
  background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.header {
  padding: 16px 20px 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.extension-name {
  font-size: 14px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  letter-spacing: 0.5px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

.logo:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.logo-icon {
  width: 16px;
  height: 16px;
  opacity: 0.9;
  filter: brightness(1.1);
}

.main-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}



@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  backdrop-filter: blur(10px);
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.primary {
  background: rgba(255, 255, 255, 0.2);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.tertiary {
  background: rgba(255, 255, 255, 0.08);
}

.btn-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.footer {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.footer-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.version {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 300;
}
</style>
