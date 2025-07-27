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

// Computed property for open links button text
const openLinksButtonText = computed(() => {
  if (buttonStates.value.openLinks !== 'Open Copied Links') {
    return buttonStates.value.openLinks;
  }
  return lastCopiedUrls.value.length > 0 
    ? `Open Copied Links (${lastCopiedUrls.value.length})`
    : 'Open Copied Links';
});

// Get extension version from manifest
onMounted(async () => {
  try {
    const manifest = browser.runtime.getManifest();
    extensionVersion.value = manifest.version;
  } catch (error) {
    console.error('Error getting manifest:', error);
  }
});

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
  
  try {
    const tabs = await browser.tabs.query({});
    const urls = tabs.map(tab => tab.url).filter((url): url is string => !!url);
    const urlsText = urls.join('\n');
    
    await navigator.clipboard.writeText(urlsText);
    lastCopiedUrls.value = urls;
    linkCategories.value = categorizeUrls(urls);
    
    // Change button text temporarily
    buttonStates.value.copyAll = `✓ ${urls.length} tabs copied!`;
    
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
  
  try {
    const tabs = await browser.tabs.query({ highlighted: true });
    const urls = tabs.map(tab => tab.url).filter((url): url is string => !!url);
    const urlsText = urls.join('\n');
    
    if (urls.length > 0) {
      await navigator.clipboard.writeText(urlsText);
      lastCopiedUrls.value = urls;
      linkCategories.value = categorizeUrls(urls);
      
      // Change button text temporarily
      buttonStates.value.copySelected = `✓ ${urls.length} selected tab(s) copied!`;
    } else {
      buttonStates.value.copySelected = '⚠ No tabs selected';
    }
    
    setTimeout(() => {
      buttonStates.value.copySelected = 'Copy Selected Tabs URLs';
    }, 2000);
  } catch (error) {
    console.error('Error copying selected tabs:', error);
    buttonStates.value.copySelected = '✗ Error copying selected tabs';
    
    setTimeout(() => {
      buttonStates.value.copySelected = 'Copy Selected Tabs URLs';
    }, 2000);
  } finally {
    isLoading.value = false;
  }
};

// Open copied links with smart categorization
const openCopiedLinks = async () => {
  if (lastCopiedUrls.value.length === 0) {
    buttonStates.value.openLinks = '⚠ No links to open. Copy tabs first!';
    setTimeout(() => {
      buttonStates.value.openLinks = 'Open Copied Links';
    }, 2000);
    return;
  }

  isLoading.value = true;
  
  try {
    const categories = linkCategories.value;
    const totalLinks = lastCopiedUrls.value.length;
    
    buttonStates.value.openLinks = `Opening ${totalLinks} links...`;
    
    // Open links with smart timing to prevent browser blocking
    for (let i = 0; i < lastCopiedUrls.value.length; i++) {
      const url = lastCopiedUrls.value[i];
      
      try {
        // Validate URL before opening
        new URL(url);
        
        await browser.tabs.create({
          url: url,
          active: i === 0 // Only make the first tab active
        });
        
        // Add small delay between tab creation to prevent browser blocking
        if (i < lastCopiedUrls.value.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (urlError) {
        console.warn('Invalid URL skipped:', url);
      }
    }
    
    // Show success message
    buttonStates.value.openLinks = `✓ Opened ${totalLinks} links!`;
    
    setTimeout(() => {
      buttonStates.value.openLinks = 'Open Copied Links';
    }, 2000);
  } catch (error) {
    console.error('Error opening links:', error);
    buttonStates.value.openLinks = '✗ Error opening links';
    
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
