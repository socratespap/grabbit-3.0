<template>
  <div>
    <h3 class="section-title">Review Configuration</h3>
    <p class="popup-description">Review your action configuration before creating</p>
    
    <!-- Activation Keys Review -->
    <div class="config-section">
      <label class="config-label">
        Activation Keys
      </label>
      <div class="review-card">
        <div class="review-item">
          <span class="review-label">Mouse Button:</span>
          <span class="review-value mouse-button">
            <svg class="review-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getMouseButtonIcon(selectedMouseButton)" />
            </svg>
            {{ getMouseButtonLabel(selectedMouseButton) }}
          </span>
        </div>
        
        <div class="review-item" v-if="selectedModifiers.length > 0">
          <span class="review-label">Modifier Keys:</span>
          <div class="review-value">
            <span v-for="modifier in selectedModifiers" :key="modifier" class="modifier-tag">
              {{ getModifierLabel(modifier) }}
            </span>
          </div>
        </div>
        
        <div class="review-item">
          <span class="review-label">Selection Box:</span>
          <div class="review-value selection-preview">
            <div 
              class="color-preview" 
              :style="{ 
                backgroundColor: selectedColor,
                borderStyle: selectedBorderType,
                borderWidth: `${selectedBorderSize}px`,
                borderColor: selectedColor
              }"
            ></div>
            <span class="selection-details">
              {{ selectedColor }} • {{ getBorderTypeLabel(selectedBorderType) }} • {{ selectedBorderSize }}px
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Action Review -->
    <div class="config-section">
      <label class="config-label">
        Action Configuration
      </label>
      <div class="review-card">
        <div class="review-item">
          <span class="review-label">Action Type:</span>
          <span class="review-value action-type">
            <svg class="review-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getActionIcon(selectedAction)" />
            </svg>
            {{ getActionLabel(selectedAction) }}
          </span>
        </div>
        
        <div class="review-item" v-if="hasAdvancedOptions">
          <span class="review-label">Advanced Options:</span>
          <div class="review-value">
            <div class="advanced-options-preview">
              <div v-for="(value, key) in currentAdvancedOptions" :key="String(key)" class="option-item">
                <span class="option-key">{{ formatOptionKey(String(key)) }}:</span>
                <span class="option-value">{{ formatOptionValue(value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Summary -->
    <div class="config-section">
      <div class="summary-card">
        <h4 class="summary-title">Action Summary</h4>
        <p class="summary-text">
          When you {{ getModifierText() }}{{ getMouseButtonLabel(selectedMouseButton).toLowerCase() }} on elements, 
          this action will {{ getActionDescription(selectedAction) }}.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  selectedMouseButton: string;
  selectedModifiers: string[];
  selectedColor: string;
  selectedBorderType: string;
  selectedBorderSize: number;
  selectedAction: string;
  advancedOptions: Record<string, any>;
}

const props = defineProps<Props>();

// Computed properties
const currentAdvancedOptions = computed(() => {
  return props.advancedOptions[props.selectedAction] || {};
});

const hasAdvancedOptions = computed(() => {
  return Object.keys(currentAdvancedOptions.value).length > 0;
});

// Helper functions
const getMouseButtonLabel = (button: string): string => {
  const labels: Record<string, string> = {
    'left': 'Left Click',
    'middle': 'Middle Click',
    'right': 'Right Click'
  };
  return labels[button] || button;
};

const getMouseButtonIcon = (button: string): string => {
  const icons: Record<string, string> = {
    'left': 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122',
    'middle': 'M12 8v8m0 0l3-3m-3 3l-3-3',
    'right': 'M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z'
  };
  return icons[button] || icons['left'];
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

const getBorderTypeLabel = (borderType: string): string => {
  const labels: Record<string, string> = {
    'solid': 'Solid',
    'dashed': 'Dashed',
    'dotted': 'Dotted'
  };
  return labels[borderType] || borderType;
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

const getActionDescription = (action: string): string => {
  const descriptions: Record<string, string> = {
    'open_new_tab': 'open the selected links in new browser tabs',
    'open_new_window': 'open the selected links in a new window',
    'copy_urls': 'copy the URLs of selected links to your clipboard',
    'copy_urls_with_title': 'copy the URLs along with their page titles to your clipboard',
    'copy_titles': 'copy only the page titles of selected links to your clipboard'
  };
  return descriptions[action] || 'perform the selected action';
};

const getModifierText = (): string => {
  if (props.selectedModifiers.length === 0) return '';
  const modifierLabels = props.selectedModifiers.map(getModifierLabel);
  return modifierLabels.join(' + ') + ' + ';
};

const formatOptionKey = (key: string): string => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const formatOptionValue = (value: any): string => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
};
</script>

<style scoped>
.review-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 0.5rem;
}

.review-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.review-item:last-child {
  border-bottom: none;
}

.review-label {
  font-weight: 500;
  color: white;
  min-width: 120px;
}

.review-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 500;
}

.review-icon {
  width: 16px;
  height: 16px;
  color: white;
}

.modifier-tag {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  flex-shrink: 0;
}

.selection-details {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.advanced-options-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.option-key {
  color: rgba(255, 255, 255, 0.8);
  min-width: 100px;
}

.option-value {
  color: white;
  font-weight: 500;
}

.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 0.5rem;
}

.summary-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.summary-text {
  margin: 0;
  line-height: 1.6;
  opacity: 0.95;
}

@media (max-width: 640px) {
  .review-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .review-label {
    min-width: auto;
  }
}
</style>