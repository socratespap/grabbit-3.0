<script lang="ts" setup>
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps<{
  settings: {
    urlFormat: string;
    includeTitle: boolean;
    sortOrder: string;
    exportFormat: string;
    notifications: boolean;
    theme: string;
    excludeLinks: boolean;
    excludedDomains: string;
    blankLines: number;
  };
  saveMessage: string;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  updateSettings: [settings: typeof props.settings];
  saveSettings: [];
  resetToDefaults: [];
  exportSettings: [];
  importSettings: [event: Event];
}>();

// Notification state
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref<'success' | 'error'>('success');

// Watch for save message changes to show bubble notification
watch(() => props.saveMessage, (newMessage) => {
  if (newMessage) {
    notificationMessage.value = newMessage;
    notificationType.value = newMessage.includes('Error') || newMessage.includes('✗') ? 'error' : 'success';
    showNotification.value = true;
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      showNotification.value = false;
    }, 3000);
  }
});

const updateSetting = (key: string, value: any) => {
  const newSettings = { ...props.settings, [key]: value };
  emit('updateSettings', newSettings);
  emit('saveSettings');
};

const hideNotification = () => {
  showNotification.value = false;
};
</script>

<template>
  <div class="popup-options">
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
              <input type="radio" :value="'plain'" :checked="settings.urlFormat === 'plain'" @change="updateSetting('urlFormat', 'plain')" />
              <span class="radio-custom"></span>
              <div class="radio-content">
                <span class="radio-text">Plain Text</span>
                <p class="format-description">Simple URLs, one per line</p>
                <div class="format-example">
                  <strong>Example:</strong><br>
                  <span v-if="settings.includeTitle">
                    Example Site - https://example.com<br>
                    <span v-for="n in settings.blankLines" :key="n"><br></span>
                    GitHub - https://github.com
                  </span>
                  <span v-else>
                    https://example.com<br>
                    <span v-for="n in settings.blankLines" :key="n"><br></span>
                    https://github.com
                  </span>
                </div>
              </div>
            </label>
            
            <label class="radio-option">
              <input type="radio" :value="'markdown'" :checked="settings.urlFormat === 'markdown'" @change="updateSetting('urlFormat', 'markdown')" />
              <span class="radio-custom"></span>
              <div class="radio-content">
                <span class="radio-text">Markdown Links</span>
                <p class="format-description">Clickable links in Markdown format</p>
                <div class="format-example">
                  <strong>Example:</strong><br>
                  <span v-if="settings.includeTitle">
                    [Example Site](https://example.com)<br>
                    <span v-for="n in settings.blankLines" :key="n"><br></span>
                    [GitHub](https://github.com)
                  </span>
                  <span v-else>
                    [https://example.com](https://example.com)<br>
                    <span v-for="n in settings.blankLines" :key="n"><br></span>
                    [https://github.com](https://github.com)
                  </span>
                </div>
              </div>
            </label>
            
            <label class="radio-option">
              <input type="radio" :value="'html'" :checked="settings.urlFormat === 'html'" @change="updateSetting('urlFormat', 'html')" />
              <span class="radio-custom"></span>
              <div class="radio-content">
                <span class="radio-text">HTML Links</span>
                <p class="format-description">Clickable links in HTML format</p>
                <div class="format-example">
                  <strong>Example:</strong><br>
                  <span v-if="settings.includeTitle">
                    &lt;a href="https://example.com"&gt;Example Site&lt;/a&gt;<br>
                    <span v-for="n in settings.blankLines" :key="n"><br></span>
                    &lt;a href="https://github.com"&gt;GitHub&lt;/a&gt;
                  </span>
                  <span v-else>
                    &lt;a href="https://example.com"&gt;https://example.com&lt;/a&gt;<br>
                    <span v-for="n in settings.blankLines" :key="n"><br></span>
                    &lt;a href="https://github.com"&gt;https://github.com&lt;/a&gt;
                  </span>
                </div>
              </div>
            </label>
            
            <label class="radio-option">
              <input type="radio" :value="'json'" :checked="settings.urlFormat === 'json'" @change="updateSetting('urlFormat', 'json')" />
              <span class="radio-custom"></span>
              <div class="radio-content">
                <span class="radio-text">JSON Format</span>
                <p class="format-description">Structured data with metadata</p>
                <div class="format-example">
                   <strong>Example:</strong><br>
                   <span v-if="settings.includeTitle">
                     {"urls": [{"url": "https://example.com", "title": "Example Site"}, {"url": "https://github.com", "title": "GitHub"}]}
                   </span>
                   <span v-else>
                     {"urls": [{"url": "https://example.com"}, {"url": "https://github.com"}]}
                   </span>
                 </div>
              </div>
            </label>
            
            <label class="radio-option">
              <input type="radio" :value="'csv'" :checked="settings.urlFormat === 'csv'" @change="updateSetting('urlFormat', 'csv')" />
              <span class="radio-custom"></span>
              <div class="radio-content">
                <span class="radio-text">CSV Format</span>
                <p class="format-description">Tab-separated format for spreadsheets</p>
                <div class="format-example">
                   <strong>Example:</strong><br>
                   <span v-if="settings.includeTitle">
                     https://example.com&nbsp;&nbsp;&nbsp;&nbsp;Example Site<br>
                     <span v-for="n in settings.blankLines" :key="n"><br></span>
                     https://github.com&nbsp;&nbsp;&nbsp;&nbsp;GitHub
                   </span>
                   <span v-else>
                     https://example.com<br>
                     <span v-for="n in settings.blankLines" :key="n"><br></span>
                     https://github.com
                   </span>
                 </div>
              </div>
            </label>
          </div>
          
          <div class="setting-item include-titles-item">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                :checked="settings.includeTitle" 
                @change="updateSetting('includeTitle', ($event.target as HTMLInputElement).checked)"
                class="toggle-input"
              >
              <span class="toggle-slider"></span>
              <span class="toggle-text">Include page titles</span>
            </label>
            <p class="setting-description">When enabled, page titles will be included with URLs (applies to Markdown and HTML formats)</p>
          </div>
          
          <div class="setting-item blank-lines-item">
            <label class="setting-label">Blank lines between links</label>
            <p class="setting-description">Number of blank lines to add between each link (does not apply to JSON format)</p>
            <div class="number-input-container">
              <input 
                type="number" 
                :value="settings.blankLines" 
                @input="updateSetting('blankLines', parseInt(($event.target as HTMLInputElement).value) || 0)"
                min="0"
                max="5"
                class="number-input"
              >
              <span class="number-label">lines</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Behavior Section -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Behavior
        </h2>
        
        
        
        <div class="setting-item">
          <label class="toggle-label">
            <input 
              type="checkbox" 
              :checked="settings.excludeLinks" 
              @change="updateSetting('excludeLinks', ($event.target as HTMLInputElement).checked)"
              class="toggle-input"
            >
            <span class="toggle-slider"></span>
            <span class="toggle-text">Exclude these links from being copied</span>
          </label>
          <p class="setting-description">Prevent specific domains or URLs from being included when copying tabs</p>
        </div>
        
        <div v-if="settings.excludeLinks" class="setting-group excluded-domains-group">
          <label class="setting-label">Excluded domains and URLs</label>
          <textarea 
            :value="settings.excludedDomains" 
            @input="updateSetting('excludedDomains', ($event.target as HTMLTextAreaElement).value)"
            placeholder="example.com&#10;ads.google.com&#10;https://unwanted-site.com&#10;*.tracker.com"
            class="textarea-input"
            rows="4"
          ></textarea>
          <div class="exclude-examples">
            <div class="examples-section">
              <h4 class="examples-title">Examples:</h4>
              <ul class="examples-list">
                <li><code>example.com</code> - Excludes all URLs from this domain</li>
                <li><code>https://www.specific-page.com/path</code> - Excludes this exact URL</li>
                <li><code>*.ads.com</code> - Excludes all subdomains (ads.com, banner.ads.com, etc.)</li>
                <li><code>social-media.com/ads/*</code> - Excludes all URLs starting with this path</li>
              </ul>
            </div>
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
          <label class="setting-label">Sort order</label>
          <select 
            :value="settings.sortOrder" 
            @change="updateSetting('sortOrder', ($event.target as HTMLSelectElement).value)"
            class="select-input"
          >
            <option value="tab-order">Tab order (default)</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="domain">Group by domain</option>
          </select>
        </div>
        

      </section>

    </div>
    
    <!-- Bubble Notification -->
    <Transition name="notification">
      <div v-if="showNotification" class="notification-bubble" :class="notificationType" @click="hideNotification">
        <div class="notification-content">
          <div class="notification-icon">
            <svg v-if="notificationType === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span class="notification-text">{{ notificationMessage }}</span>
          <button class="notification-close" @click.stop="hideNotification">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* All the existing styles from the main App.vue for settings sections */
/* Main Container */
.popup-options {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

/* Settings Sections */
.settings-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
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

.include-titles-item {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
  box-sizing: border-box;
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
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.radio-option:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.radio-option input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s ease;
}

.radio-option input[type="radio"]:checked + .radio-custom {
  border-color: #4caf50;
  background: #4caf50;
}

.radio-option input[type="radio"]:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

.radio-content {
  flex: 1;
}

.radio-text {
  font-size: 14px;
  font-weight: 500;
  color: white;
  display: block;
  margin-bottom: 4px;
}

.format-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.format-example {
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.format-example strong {
  color: rgba(255, 255, 255, 0.9);
}

/* Toggle Switches */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  flex-shrink: 0;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background: #4caf50;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-text {
  flex: 1;
}

/* Form Inputs */
.select-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-input:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.select-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.select-input option {
  background: #1565c0;
  color: white;
}

.number-input {
  width: 100px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 14px;
  text-align: center;
  transition: all 0.2s ease;
}

.number-input:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.number-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.textarea-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.textarea-input:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.textarea-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.textarea-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.excluded-domains-group {
  margin-top: 16px;
  padding-left: 20px;
  border-left: 3px solid rgba(255, 255, 255, 0.2);
}

.exclude-examples {
  margin-top: 12px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  box-sizing: border-box;
}

.examples-section {
  margin-bottom: 0;
}

.examples-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 8px 0;
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



/* Number Input Styles */
.blank-lines-item {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.number-input-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.number-input {
  width: 80px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
}

.number-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input[type=number] {
  -moz-appearance: textfield;
}

.number-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

/* Bubble Notification */
.notification-bubble {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.notification-bubble::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
}

.notification-bubble:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.2);
}

.notification-bubble.success {
  border-left: 4px solid #4caf50;
}

.notification-bubble.error {
  border-left: 4px solid #f44336;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  position: relative;
  z-index: 1;
}

.notification-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.notification-bubble.success .notification-icon {
  color: #4caf50;
}

.notification-bubble.error .notification-icon {
  color: #f44336;
}

.notification-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

.notification-close {
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

/* Notification Transitions */
.notification-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.notification-enter-to,
.notification-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .popup-options {
    padding: 16px;
  }
  
  .settings-container {
    gap: 24px;
    max-width: 100%;
  }
  
  .settings-section {
    padding: 20px;
  }
  
  .section-title {
    font-size: 18px;
  }
  
  .radio-option {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .radio-content {
    width: 100%;
  }
  
  .format-example {
    font-size: 10px;
  }
  
  .excluded-domains-group {
    padding-left: 12px;
  }
  
  /* Mobile notification adjustments */
  .notification-bubble {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .notification-content {
    padding: 14px 16px;
    gap: 10px;
  }
  
  .notification-text {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .popup-options {
    padding: 12px;
  }
  
  .settings-container {
    gap: 20px;
  }
  
  .settings-section {
    padding: 16px;
  }
  
  .section-title {
    font-size: 16px;
    gap: 8px;
  }
  
  .section-icon {
    width: 20px;
    height: 20px;
  }
  
  .radio-option {
    padding: 10px;
    gap: 8px;
  }
  
  .toggle-label {
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .excluded-domains-group {
    padding-left: 8px;
    margin-top: 12px;
  }
  
  .exclude-examples {
    padding: 12px;
  }
  
  /* Small mobile notification adjustments */
  .notification-bubble {
    top: 8px;
    right: 8px;
    left: 8px;
  }
  
  .notification-content {
    padding: 12px 14px;
    gap: 8px;
  }
  
  .notification-text {
    font-size: 12px;
  }
  
  .notification-icon {
    width: 20px;
    height: 20px;
  }
  
  .notification-close {
    width: 18px;
    height: 18px;
  }
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
</style>