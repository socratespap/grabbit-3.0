<script lang="ts" setup>
import { defineProps, defineEmits, ref, watch } from 'vue';
import '../styles/shared.css';
import '../styles/popup-options.css';

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
/* Component-specific styles are now in their respective CSS files */
</style>