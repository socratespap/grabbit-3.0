<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import browser from 'webextension-polyfill';

const extensionName = 'Grabbit';
const extensionVersion = ref('1.0.0');

// Settings state
const settings = ref({
  urlFormat: 'plain', // 'plain', 'markdown', 'html'
  includeTitle: true,
  sortOrder: 'tab-order', // 'tab-order', 'alphabetical', 'domain'
  exportFormat: 'text', // 'text', 'json', 'csv'
  notifications: true,
  theme: 'auto', // 'auto', 'light', 'dark'
  excludeLinks: false,
  excludedDomains: ''
});

const isSaving = ref(false);
const saveMessage = ref('');

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
    
    // Load saved settings
    if (browser.storage && browser.storage.sync) {
      const savedSettings = await browser.storage.sync.get('settings');
      if (savedSettings.settings) {
        settings.value = { ...settings.value, ...savedSettings.settings };
      }
    }
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
    settings.value = {
      urlFormat: 'plain',
      includeTitle: true,
      sortOrder: 'tab-order',
      exportFormat: 'text',
      notifications: true,
      theme: 'auto',
      excludeLinks: false,
      excludedDomains: ''
    };
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
            <p class="tagline">Extension Settings</p>
          </div>
        </div>
        <div class="version-badge">
          v{{ extensionVersion }}
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="settings-container">
        <!-- URL Format Section -->
        <section class="settings-section">
          <h2 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            URL Format
          </h2>
          <div class="setting-group">
            <label class="setting-label">Output Format</label>
            <p class="setting-description">Choose how URLs are formatted when copied to clipboard:</p>
            
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="settings.urlFormat" value="plain" @change="saveSettings" />
                <span class="radio-custom"></span>
                <div class="radio-content">
                  <span class="radio-text">Plain Text</span>
                  <p class="format-description">Simple URLs, one per line</p>
                  <div class="format-example">
                    <strong>Example:</strong><br>
                    https://example.com<br>
                    https://github.com
                  </div>
                </div>
              </label>
              
              <label class="radio-option">
                <input type="radio" v-model="settings.urlFormat" value="markdown" @change="saveSettings" />
                <span class="radio-custom"></span>
                <div class="radio-content">
                  <span class="radio-text">Markdown Links</span>
                  <p class="format-description">Clickable links in Markdown format</p>
                  <div class="format-example">
                    <strong>Example:</strong><br>
                    [Example Site](https://example.com)<br>
                    [GitHub](https://github.com)
                  </div>
                </div>
              </label>
              
              <label class="radio-option">
                <input type="radio" v-model="settings.urlFormat" value="html" @change="saveSettings" />
                <span class="radio-custom"></span>
                <div class="radio-content">
                  <span class="radio-text">HTML Links</span>
                  <p class="format-description">Clickable links in HTML format</p>
                  <div class="format-example">
                    <strong>Example:</strong><br>
                    &lt;a href="https://example.com"&gt;Example Site&lt;/a&gt;<br>
                    &lt;a href="https://github.com"&gt;GitHub&lt;/a&gt;
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <div class="setting-item">
            <label class="toggle-label">
              <input type="checkbox" v-model="settings.includeTitle" @change="saveSettings" class="toggle-input" />
              <span class="toggle-slider"></span>
              <span class="toggle-text">Include page titles</span>
            </label>
            <p class="setting-description">Add page titles alongside URLs when copying</p>
          </div>
        </section>

        <!-- Behavior Section -->
        <section class="settings-section">
          <h2 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Behavior
          </h2>
          
          <div class="setting-item">
            <label class="toggle-label">
              <input type="checkbox" v-model="settings.notifications" @change="saveSettings" class="toggle-input" />
              <span class="toggle-slider"></span>
              <span class="toggle-text">Show notifications</span>
            </label>
            <p class="setting-description">Display notifications when URLs are copied</p>
          </div>
          
          <div class="setting-item">
            <label class="toggle-label">
              <input type="checkbox" v-model="settings.excludeLinks" @change="saveSettings" class="toggle-input" />
              <span class="toggle-slider"></span>
              <span class="toggle-text">Exclude these links from being copied</span>
            </label>
            <p class="setting-description">Prevent specific domains or URLs from being included when copying</p>
          </div>
          
          <div v-if="settings.excludeLinks" class="setting-group">
            <label class="setting-label">Excluded domains and URLs</label>
            <textarea 
              v-model="settings.excludedDomains" 
              @input="saveSettings" 
              class="textarea-input"
              rows="6"
              placeholder="Enter domains or URLs to exclude, one per line:"
            ></textarea>
            <div class="exclude-examples">
              <p class="examples-title">Examples:</p>
              <ul class="examples-list">
                <li><code>example.com</code> - Excludes all URLs from example.com</li>
                <li><code>*.ads.com</code> - Excludes all subdomains of ads.com</li>
                <li><code>https://tracker.site.com</code> - Excludes specific URL</li>
                <li><code>facebook.com/tr</code> - Excludes specific path</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Organization Section -->
        <section class="settings-section">
          <h2 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Organization
          </h2>
          <div class="setting-group">
            <label class="setting-label">Sort Order</label>
            <select v-model="settings.sortOrder" @change="saveSettings" class="select-input">
              <option value="tab-order">Tab Order</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="domain">By Domain</option>
            </select>
          </div>
          
          <div class="setting-group">
            <label class="setting-label">Export Format</label>
            <select v-model="settings.exportFormat" @change="saveSettings" class="select-input">
              <option value="text">Text File</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </section>

        <!-- Save Message -->
        <div v-if="saveMessage" class="save-message" :class="{ error: saveMessage.includes('Error') }">
          {{ saveMessage }}
        </div>
      </div>
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
          <span class="copyright">© 2024 Grabbit Extension</span>
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

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Settings Sections */
.settings-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 24px 0;
  color: white;
}

.section-icon {
  width: 24px;
  height: 24px;
  opacity: 0.8;
}

/* Setting Items */
.setting-group {
  margin-bottom: 24px;
}

.setting-item {
  margin-bottom: 24px;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.9);
}

.setting-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 4px 0 0 0;
  line-height: 1.4;
}

/* Radio Groups */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;
  position: relative;
}

.radio-option:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.radio-option:has(input:checked) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.radio-option input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
  margin-top: 2px;
}

.radio-option input[type="radio"]:checked + .radio-custom {
  border-color: white;
  background: white;
}

.radio-option input[type="radio"]:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: #2196f3;
  border-radius: 50%;
}

.radio-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.format-description {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.4;
}

.format-example {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 4px;
}

.format-example strong {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  margin-bottom: 6px;
  display: block;
}

/* Toggle Switches */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.toggle-label:hover {
  background: rgba(255, 255, 255, 0.05);
}

.toggle-input {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  position: relative;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.toggle-input:checked + .toggle-slider {
  background: rgba(255, 255, 255, 0.3);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* Select and Input Styles */
.select-input,
.number-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
}

.select-input:focus,
.number-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.select-input option {
  background: #1565c0;
  color: white;
}

.number-input {
  max-width: 120px;
}

.textarea-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 120px;
}

.textarea-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.textarea-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.exclude-examples {
  margin-top: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid rgba(255, 255, 255, 0.3);
}

.examples-title {
  margin: 0 0 8px 0;
  font-weight: 600;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.examples-list {
  margin: 0;
  padding-left: 16px;
  list-style-type: disc;
}

.examples-list li {
  margin-bottom: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.examples-list code {
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Save Message */
.save-message {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #4caf50;
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  margin-top: 24px;
  animation: slideIn 0.3s ease-out;
}

.save-message.error {
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.3);
  color: #f44336;
}

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
}
</style>