<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import '../styles/AdvancedOptionsMenu.css';

interface Props {
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
    avoidDuplicates: boolean;
    [key: string]: any;
  };
}

interface Emits {
  (e: 'update-settings', settings: Props['settings']): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local state for domain management
const newDomain = ref('');
const isAddingDomain = ref(false);
const notification = ref<{ message: string; type: 'error' | 'success' } | null>(null);
let notificationTimeout: NodeJS.Timeout | undefined;

const showNotification = (message: string, type: 'error' | 'success', duration = 3000) => {
  notification.value = { message, type };
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notification.value = null;
  }, duration);
};

// Parse excluded domains from settings
const excludedDomains = computed(() => {
  if (!props.settings.excludedDomains) return [];
  return props.settings.excludedDomains
    .split(',')
    .map(domain => domain.trim())
    .filter(domain => domain.length > 0);
});

// Add new domain
const addDomain = () => {
  const domain = newDomain.value.trim();
  if (!domain) return;
  
  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    showNotification('Please enter a valid domain (e.g., example.com)', 'error');
    return;
  }
  
  // Check if domain already exists
  if (excludedDomains.value.includes(domain)) {
    showNotification('This domain is already in the exclusion list.', 'error');
    return;
  }
  
  // Add domain to the list
  const updatedDomains = [...excludedDomains.value, domain];
  updateExcludedDomains(updatedDomains);
  
  // Clear input and show success
  newDomain.value = '';
  isAddingDomain.value = false;
  showNotification(`Domain '${domain}' added successfully.`, 'success');
};

// Remove domain
const removeDomain = (domainToRemove: string) => {
  const updatedDomains = excludedDomains.value.filter(domain => domain !== domainToRemove);
  updateExcludedDomains(updatedDomains);
};

// Update excluded domains in settings
const updateExcludedDomains = (domains: string[]) => {
  const updatedSettings = {
    ...props.settings,
    excludedDomains: domains.join(', ')
  };
  emit('update-settings', updatedSettings);
};

// Handle Enter key in input
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    addDomain();
  }
};

// Cancel adding domain
const cancelAddDomain = () => {
  newDomain.value = '';
  isAddingDomain.value = false;
};
</script>

<template>
  <div class="advanced-options">
    <div class="advanced-header">
      <h2 class="advanced-title">Advanced Options</h2>
      <p class="advanced-description">
        Configure advanced settings for the Grabbit extension.
      </p>
    </div>

    <div class="settings-section">
      <!-- Domain Exclusions Section -->
      <div class="setting-group">
        <div class="setting-header">
          <h3 class="setting-title">Domain Exclusions</h3>
          <p class="setting-description">
            Add domains where Grabbit should be completely disabled. The extension will appear inactive on these sites.
          </p>
        </div>

        <!-- Excluded Domains List -->
        <div class="domains-container">
          <div v-if="excludedDomains.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shield-off"><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-8 3v7c0 6 8 10 8 10"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            </div>
            <p class="empty-text">No excluded domains configured</p>
            <p class="empty-subtext">Add domains where you want Grabbit to be disabled</p>
          </div>

          <div v-else class="domains-list">
            <div 
              v-for="domain in excludedDomains" 
              :key="domain" 
              class="domain-item"
            >
              <div class="domain-info">
                <div class="domain-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-globe"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </div>
                <span class="domain-name">{{ domain }}</span>
              </div>
              <button 
                @click="removeDomain(domain)" 
                class="remove-btn"
                title="Remove domain"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Add Domain Section -->
        <div class="add-domain-section">
          <div v-if="!isAddingDomain" class="add-domain-trigger">
            <button @click="isAddingDomain = true" class="add-domain-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Add Domain</span>
            </button>
          </div>

          <div v-else class="add-domain-form">
            <div v-if="notification" :class="['notification', `notification--${notification.type}`]">
              {{ notification.message }}
            </div>
            <div class="input-group">
              <input 
                v-model="newDomain"
                @keypress="handleKeyPress"
                type="text" 
                placeholder="example.com"
                class="domain-input"
                autofocus
              />
              <div class="input-actions">
                <button @click="addDomain" class="confirm-btn" title="Add domain">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button @click="cancelAddDomain" class="cancel-btn" title="Cancel">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
            <p class="input-help">Enter a domain name (e.g., example.com, google.com)</p>
          </div>
        </div>
      </div>

      <!-- Future Advanced Settings Placeholder -->
      <div class="setting-group">
        <div class="setting-header">
          <h3 class="setting-title">More Settings</h3>
          <p class="setting-description">
            Additional advanced settings will be available in future updates.
          </p>
        </div>
        <div class="coming-soon">
          <div class="coming-soon-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <span class="coming-soon-text">Coming Soon</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles are imported from AdvancedOptions.css */
</style>