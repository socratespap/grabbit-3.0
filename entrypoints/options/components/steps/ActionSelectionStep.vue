<template>
  <div>
    <h3 class="section-title">Action Selection</h3>
    <p class="popup-description">Choose what action should be performed when triggered</p>
    
    <div class="config-section">
      <label class="config-label">
        Action Type <span class="required">*</span>
      </label>
      <p class="config-description">Select the action that will be executed</p>
      
      <div class="action-options">
        <div 
          v-for="action in actionOptions" 
          :key="action.value"
          class="action-option" 
          :class="{ active: selectedAction === action.value }"
          @click="selectAction(action.value)"
        >
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="action.icon" />
            </svg>
          </div>
          <div class="action-content">
            <h4>{{ action.name }}</h4>
            <p>{{ action.description }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Advanced Options (Dynamic based on selected action) -->
    <div v-if="selectedAction" class="advanced-options" ref="advancedOptionsRef">
      <div class="config-section">
        <label class="config-label">
          Advanced Options
        </label>
        <p class="config-description">Configure additional settings for this action</p>
        
        <component 
          :is="getAdvancedComponent(selectedAction)"
          v-bind="getAdvancedProps(selectedAction)"
          @update="handleAdvancedUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import OpenNewTabOptions from '../advanced-options/OpenNewTabOptions.vue';
import OpenNewWindowOptions from '../advanced-options/OpenNewWindowOptions.vue';
import CopyUrlsOptions from '../advanced-options/CopyUrlsOptions.vue';
import CopyUrlsWithTitleOptions from '../advanced-options/CopyUrlsWithTitleOptions.vue';
import CopyTitlesOptions from '../advanced-options/CopyTitlesOptions.vue';

interface Props {
  selectedAction: string;
  advancedOptions: Record<string, any>;
}

interface Emits {
  'update:action': [action: string];
  'update:advanced-options': [options: Record<string, any>];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const advancedOptionsRef = ref<HTMLElement>();

const actionOptions = [
  {
    name: 'Open links in new tab',
    value: 'open_new_tab',
    description: 'Opens selected links in new browser tabs',
    icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
  },
  {
    name: 'Open links in new window',
    value: 'open_new_window',
    description: 'Opens selected links in new browser windows',
    icon: 'M8 14v3a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-8a2 2 0 00-2 2v5zM8 14V9a2 2 0 012-2h8a2 2 0 012 2v5M4 7v10a2 2 0 002 2h2'
  },
  {
    name: 'Copy URLs to clipboard',
    value: 'copy_urls',
    description: 'Copies the URLs of selected links to clipboard',
    icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
  },
  {
    name: 'Copy URLs with page title',
    value: 'copy_urls_with_title',
    description: 'Copies URLs along with their page titles to clipboard',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    name: 'Copy page titles only',
    value: 'copy_titles',
    description: 'Copies only the page titles of selected links to clipboard',
    icon: 'M4 6h16M4 12h16M4 18h7'
  }
];

const selectAction = (action: string) => {
  emit('update:action', action);
  
  // Smooth scroll to advanced options after a short delay
  if (action) {
    nextTick(() => {
      setTimeout(() => {
        if (advancedOptionsRef.value) {
          advancedOptionsRef.value.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    });
  }
};

const getAdvancedComponent = (action: string) => {
  const componentMap: Record<string, any> = {
    'open_new_tab': OpenNewTabOptions,
    'open_new_window': OpenNewWindowOptions,
    'copy_urls': CopyUrlsOptions,
    'copy_urls_with_title': CopyUrlsWithTitleOptions,
    'copy_titles': CopyTitlesOptions
  };
  return componentMap[action] || null;
};

const getAdvancedProps = (action: string) => {
  const actionOptions = props.advancedOptions[action];
  // Only pass options if they exist and have properties, otherwise let withDefaults handle it
  if (actionOptions && Object.keys(actionOptions).length > 0) {
    return { options: actionOptions };
  }
  return {}; // Don't pass options prop, let withDefaults provide defaults
};

const handleAdvancedUpdate = (options: Record<string, any>) => {
  emit('update:advanced-options', {
    ...props.advancedOptions,
    [props.selectedAction]: options
  });
};
</script>