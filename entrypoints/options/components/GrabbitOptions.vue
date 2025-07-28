<script lang="ts" setup>
import { defineEmits, ref, watch } from 'vue';
import '../styles/GrabbitOptions.css';
import ActionCreationPopup from './ActionCreationPopup.vue';

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

const emit = defineEmits<{
  goBack: [];
}>();

const showActionPopup = ref(false);
const actions = ref<ActionConfig[]>([]);

// Watch popup visibility to control body scroll
watch(showActionPopup, (isVisible) => {
  if (isVisible) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }
});

// Handle add new action
const addNewAction = () => {
  showActionPopup.value = true;
};

// Functions moved below to handle both create and edit scenarios

// Helper functions for displaying action data
const getMouseButtonLabel = (button: string): string => {
  const labels: Record<string, string> = {
    'left': 'Left Click',
    'middle': 'Middle Click',
    'right': 'Right Click'
  };
  return labels[button] || button;
};

const getModifierLabel = (modifier: string): string => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const labels: Record<string, string> = {
    'meta': isMac ? 'Cmd' : 'Win',
    'ctrl': 'Ctrl',
    'shift': 'Shift',
    'alt': isMac ? 'Option' : 'Alt'
  };
  return labels[modifier] || modifier;
};

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    'open_new_tab': 'Open links in new tab',
    'open_new_window': 'Open links in new window',
    'copy_urls': 'Copy URLs to clipboard',
    'copy_urls_with_title': 'Copy URLs with page title',
    'copy_titles': 'Copy page titles only'
  };
  return labels[action] || action;
};

const getActionIcon = (action: string): string => {
  const icons: Record<string, string> = {
    'open_new_tab': 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
    'open_new_window': 'M8 14v3a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-8a2 2 0 00-2 2v5zM8 14V9a2 2 0 012-2h8a2 2 0 012 2v5M4 7v10a2 2 0 002 2h2',
    'copy_urls': 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
    'copy_urls_with_title': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    'copy_titles': 'M4 6h16M4 12h16M4 18h7'
  };
  return icons[action] || icons['open_new_tab'];
};

const getBorderTypeLabel = (borderType: string): string => {
  const labels: Record<string, string> = {
    'solid': 'Solid',
    'dashed': 'Dashed',
    'dotted': 'Dotted'
  };
  return labels[borderType] || borderType;
};

const formatAdvancedOptions = (options: any, action: string): Array<{key: string, value: string, type: string}> => {
  const actionOptions = options[action] || {};
  if (Object.keys(actionOptions).length === 0) return [];
  
  return Object.entries(actionOptions)
    .map(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const formattedValue = typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value);
      const type = typeof value === 'boolean' ? (value ? 'enabled' : 'disabled') : 'value';
      return { key: formattedKey, value: formattedValue, type };
    });
};

const deleteAction = (actionId: string) => {
  actions.value = actions.value.filter(action => action.id !== actionId);
};

const editingAction = ref<ActionConfig | null>(null);

const editAction = (action: ActionConfig) => {
  editingAction.value = action;
  showActionPopup.value = true;
};

const closeActionPopup = () => {
  showActionPopup.value = false;
  editingAction.value = null;
};

const handleActionCreated = (config: any) => {
  if (editingAction.value) {
    // Update existing action
    const index = actions.value.findIndex(a => a.id === editingAction.value!.id);
    if (index !== -1) {
      actions.value[index] = {
        ...editingAction.value,
        ...config
      };
    }
  } else {
    // Create new action
    const newAction: ActionConfig = {
      id: Date.now().toString(),
      ...config
    };
    actions.value.push(newAction);
  }
  closeActionPopup();
};
</script>

<template>
  <div class="grabbit-options">
    <!-- Header Section -->
    <div class="grabbit-header">
      <h1 class="grabbit-title">Grabbit Actions</h1>
      <p class="grabbit-description">Create and manage custom actions for your workflow</p>
    </div>

    <!-- Actions Container -->
    <div class="actions-container" :class="{ 'has-actions': actions.length > 0 }">
      <!-- Actions List -->
      <div v-if="actions.length > 0" class="actions-list">
        <div v-for="action in actions" :key="action.id" class="action-card">
          <!-- Action Header -->
          <div class="action-header">
            <div class="action-title-section">
              <div class="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getActionIcon(action.action)" />
                </svg>
              </div>
              <h3 class="action-title">{{ getActionLabel(action.action) }}</h3>
            </div>
            <div class="action-buttons">
              <button @click="editAction(action)" class="edit-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button @click="deleteAction(action.id)" class="delete-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Action Details -->
          <div class="action-details">
            <!-- Activation Keys -->
            <div class="detail-section">
              <h4 class="detail-title">Activation</h4>
              <div class="activation-info">
                <div class="activation-keys">
                  <span v-if="action.modifiers.length > 0" class="modifiers">
                    <span v-for="modifier in action.modifiers" :key="modifier" class="modifier-key">
                      {{ getModifierLabel(modifier) }}
                    </span>
                    <span class="plus">+</span>
                  </span>
                  <span class="mouse-button">{{ getMouseButtonLabel(action.mouseButton) }}</span>
                </div>
                <div class="selection-preview">
                  <div 
                    class="color-preview" 
                    :style="{ 
                      backgroundColor: action.color,
                      borderStyle: action.borderType,
                      borderWidth: `${action.borderSize}px`,
                      borderColor: action.color
                    }"
                  ></div>
                  <span class="selection-details">
                    {{ action.color }} • {{ getBorderTypeLabel(action.borderType) }} • {{ action.borderSize }}px
                  </span>
                </div>
              </div>
            </div>

            <!-- Advanced Options -->
            <div class="detail-section">
              <h4 class="detail-title">Settings</h4>
              <div class="advanced-options-container">
                <div v-if="formatAdvancedOptions(action.advancedOptions, action.action).length === 0" class="default-settings-label">
                  Default Settings
                </div>
                <div v-else class="advanced-options-list">
                  <div 
                    v-for="option in formatAdvancedOptions(action.advancedOptions, action.action)" 
                    :key="option.key"
                    class="option-label"
                    :class="`option-${option.type}`"
                  >
                    <span class="option-key">{{ option.key }}</span>
                    <span class="option-value">{{ option.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Add New Action Button (when actions exist) -->
        <button @click="addNewAction" class="add-action-btn add-another">
          <svg class="add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Another Action
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="empty-title">No Actions Yet</h3>
        <p class="empty-description">
          Get started by creating your first custom action.<br>
          Actions help automate your workflow with Grabbit.
        </p>
        <button @click="addNewAction" class="add-action-btn">
          <svg class="add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Action
        </button>
      </div>
    </div>
    
    <!-- Action Creation Popup -->
    <ActionCreationPopup 
      :isVisible="showActionPopup" 
      :initialData="editingAction || undefined"
      :isEditing="!!editingAction"
      @close="closeActionPopup" 
      @nextStep="handleActionCreated" 
    />
  </div>
</template>

<style scoped>
/* Component-specific styles are imported from GrabbitOptions.css */
</style>