<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import browser from 'webextension-polyfill';
import PopupOptions from './components/PopupOptions.vue';
import GrabbitOptions from './components/GrabbitOptions.vue';
import './styles/shared.css';
import './styles/main-selection.css';

const extensionName = 'Grabbit';
const extensionVersion = ref('1.0.0');

// View state
const currentView = ref('main'); // 'main', 'popup-options', 'grabbit-options'

// Default settings for first install
const defaultSettings = {
  urlFormat: 'plain', // Default: Plain text
  includeTitle: false, // Default: Unchecked
  sortOrder: 'tab-order', // Default: Tab order
  exportFormat: 'text',
  notifications: false, // Default: Unchecked (behavior)
  theme: 'auto',
  excludeLinks: false, // Default: Unchecked (behavior)
  excludedDomains: '',
  blankLines: 0, // Default: No blank lines
  avoidDuplicates: true // Default: Enabled
};

// Settings state
const settings = ref({ ...defaultSettings });

const isSaving = ref(false);
const saveMessage = ref('');

// Check for account backup and initialize settings
const checkForAccountBackup = async () => {
  try {
    if (browser.storage && browser.storage.sync) {
      // Check if this is first install by looking for any existing settings
      const result = await browser.storage.sync.get(['settings', 'isFirstInstall']);
      
      if (!result.settings && result.isFirstInstall !== false) {
        // First install - check for account backup
        console.log('First install detected, checking for account backup...');
        
        // Try to get backup from connected account (if any)
        const backupResult = await browser.storage.sync.get('accountBackup');
        
        if (backupResult.accountBackup) {
          // Restore from backup
          console.log('Account backup found, restoring settings...');
          settings.value = { ...defaultSettings, ...backupResult.accountBackup };
        } else {
          // No backup found, use defaults
          console.log('No account backup found, using default settings...');
          settings.value = { ...defaultSettings };
        }
        
        // Save the initial settings and mark as not first install
        await browser.storage.sync.set({ 
          settings: settings.value,
          isFirstInstall: false 
        });
      } else if (result.settings) {
        // Existing installation - load saved settings
        settings.value = { ...defaultSettings, ...result.settings };
      }
    }
  } catch (error) {
    console.error('Error checking for account backup:', error);
    // Fallback to defaults on error
    settings.value = { ...defaultSettings };
  }
};

// Get extension version from manifest
onMounted(async () => {
  try {
    // Check if browser APIs are available
    if (typeof browser === 'undefined' || !browser.runtime) {
      console.warn('Browser extension APIs not available in development mode');
      return;
    }
    
    const manifest = browser.runtime.getManifest();
    extensionVersion.value = manifest.version;
    
    // Initialize settings with backup check
    await checkForAccountBackup();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
});

// Save settings
const saveSettings = async () => {
  isSaving.value = true;
  saveMessage.value = '';
  
  try {
    // Check if browser storage API is available
    if (typeof browser === 'undefined' || !browser.storage || !browser.storage.sync) {
      console.warn('Storage API not available in development mode');
      saveMessage.value = '⚠ Storage not available (dev mode)';
      setTimeout(() => {
        saveMessage.value = '';
      }, 3000);
      return;
    }
    
    await browser.storage.sync.set({ settings: settings.value });
    saveMessage.value = '✓ Settings saved successfully!';
    
    setTimeout(() => {
      saveMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('Error saving settings:', error);
    saveMessage.value = '✗ Error saving settings';
  } finally {
    isSaving.value = false;
  }
};

// Reset to defaults
const resetToDefaults = async () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    settings.value = { ...defaultSettings };
    await saveSettings();
  }
};

// Export settings
const exportSettings = () => {
  const dataStr = JSON.stringify(settings.value, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'grabbit-settings.json';
  link.click();
  
  URL.revokeObjectURL(url);
};

// Import settings
const importSettings = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const importedSettings = JSON.parse(e.target?.result as string);
      settings.value = { ...settings.value, ...importedSettings };
      await saveSettings();
    } catch (error) {
      alert('Error importing settings. Please check the file format.');
    }
  };
  reader.readAsText(file);
};

// Navigation functions
const showPopupOptions = () => {
  currentView.value = 'popup-options';
};

const showGrabbitOptions = () => {
  currentView.value = 'grabbit-options';
};

const goBack = () => {
  currentView.value = 'main';
};

// Settings management functions
const updateSettings = (newSettings: typeof settings.value) => {
  settings.value = newSettings;
};
</script>

<template>
  <div class="options-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="brand">
          <div class="logo">
            <img src="/icon/32.png" alt="Grabbit" class="logo-icon" />
          </div>
          <div class="brand-text">
            <h1 class="extension-name">{{ extensionName }}</h1>
            <p class="tagline">{{ currentView === 'main' ? 'Choose Settings Category' : 'Extension Settings' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button v-if="currentView !== 'main'" @click="goBack" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div class="version-badge">
            v{{ extensionVersion }}
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Main Selection View -->
      <div v-if="currentView === 'main'" class="main-selection">
        <div class="selection-container">
          <h2 class="selection-title">Settings Categories</h2>
          <p class="selection-description">Choose which settings you'd like to configure:</p>
          
          <div class="option-cards">
            <button @click="showGrabbitOptions" class="option-card">
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div class="card-content">
                <h3 class="card-title">Grabbit Options</h3>
                <p class="card-description">Core extension settings and preferences</p>
              </div>
              <div class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            
            <button @click="showPopupOptions" class="option-card">
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div class="card-content">
                <h3 class="card-title">Popup Options</h3>
                <p class="card-description">Customize popup behavior and appearance</p>
              </div>
              <div class="card-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Popup Options View -->
      <PopupOptions 
         v-if="currentView === 'popup-options'"
         :settings="settings"
         :save-message="saveMessage"
         :is-saving="isSaving"
         @update-settings="updateSettings"
         @save-settings="saveSettings"
         @reset-to-defaults="resetToDefaults"
         @export-settings="exportSettings"
         @import-settings="importSettings"
       />

      <!-- Grabbit Options View -->
      <GrabbitOptions 
        v-if="currentView === 'grabbit-options'"
        :settings="settings"
        @update-settings="updateSettings"
      />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-actions">
          <button @click="resetToDefaults" class="footer-btn secondary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset to Defaults
          </button>
          
          <button @click="exportSettings" class="footer-btn secondary">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Settings
          </button>
          
          <label class="footer-btn secondary file-input-label">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import Settings
            <input type="file" @change="importSettings" accept=".json" class="file-input" />
          </label>
        </div>
        
        <div class="footer-info">
          <span class="copyright">© 2025 Grabbit Extension</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Component-specific styles are now in their respective CSS files */
</style>