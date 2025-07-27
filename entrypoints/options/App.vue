<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import browser from 'webextension-polyfill';
import PopupOptions from './components/PopupOptions.vue';
import GrabbitOptions from './components/GrabbitOptions.vue';

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
  excludedDomains: ''
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
.options-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.logo-icon {
  width: 32px;
  height: 32px;
  opacity: 0.9;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.extension-name {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.5px;
}

.tagline {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-weight: 400;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.version-badge {
  background: rgba(255, 255, 255, 0.15);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 40px 24px;
}

/* Main Selection */
.main-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.selection-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.selection-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: white;
  letter-spacing: -0.5px;
}

.selection-description {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 48px 0;
  line-height: 1.5;
}

.option-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.option-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.card-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg {
  width: 24px;
  height: 24px;
  opacity: 0.9;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: white;
}

.card-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.4;
}

.card-arrow {
  width: 24px;
  height: 24px;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.option-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(4px);
}

.card-arrow svg {
  width: 100%;
  height: 100%;
}



/* Component-specific styles are now in their respective component files */

/* Footer */
.footer {
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px 0;
}

.footer-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.footer-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.footer-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.file-input-label {
  position: relative;
  overflow: hidden;
}

.file-input {
  position: absolute;
  left: -9999px;
  opacity: 0;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.copyright {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* Animations */
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

/* Responsive Design */
@media (max-width: 768px) {
  .header-content,
  .settings-container,
  .footer-content {
    padding: 0 16px;
  }
  
  .main-content {
    padding: 24px 16px;
  }
  
  .settings-section {
    padding: 20px;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-actions {
    justify-content: center;
  }
  
  .radio-group {
    gap: 8px;
  }
  
  .extension-name {
    font-size: 24px;
  }
  
  .selection-title {
    font-size: 28px;
  }
  
  .selection-description {
    font-size: 15px;
    margin-bottom: 32px;
  }
  
  .option-card {
    padding: 20px;
    gap: 16px;
  }
  
  .card-icon {
    width: 40px;
    height: 40px;
  }
  
  .card-icon svg {
    width: 20px;
    height: 20px;
  }
  
  .card-title {
    font-size: 16px;
  }
  
  .card-description {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .brand {
    gap: 12px;
  }
  
  .logo {
    width: 40px;
    height: 40px;
  }
  
  .logo-icon {
    width: 24px;
    height: 24px;
  }
  
  .extension-name {
    font-size: 20px;
  }
  
  .section-title {
    font-size: 18px;
  }
  
  .footer-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .footer-btn {
    justify-content: center;
    width: 100%;
  }
  
  .selection-title {
    font-size: 24px;
  }
  
  .selection-description {
    font-size: 14px;
    margin-bottom: 24px;
  }
  
  .option-card {
    padding: 16px;
    gap: 12px;
  }
  
  .card-title {
    font-size: 15px;
  }
  
  .card-description {
    font-size: 12px;
  }
  
  .header-actions {
    gap: 12px;
  }
  
  .back-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .back-btn svg {
    width: 14px;
    height: 14px;
  }
}
</style>