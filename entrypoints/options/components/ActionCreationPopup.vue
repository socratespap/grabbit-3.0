<template>
  <div v-if="isVisible" class="popup-overlay" @click="closePopup">
    <div class="popup-container" @click.stop>
      <div class="popup-header">
        <h2 class="popup-title">Create New Action - Step {{ currentStep }}</h2>
        <button @click="closePopup" class="close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="popup-content">
        <div class="step-indicator">
          <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">1</div>
          <div class="step-line" :class="{ completed: currentStep > 1 }"></div>
          <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">2</div>
          <div class="step-line" :class="{ completed: currentStep > 2 }"></div>
          <div class="step" :class="{ active: currentStep === 3 }">3</div>
        </div>
        
        <!-- Step 1: Activation Keys Configuration -->
        <div v-if="currentStep === 1">
          <h3 class="section-title">Activation Keys</h3>
          <p class="popup-description">Configure how this action will be triggered</p>
        
        <!-- Mouse Button Selection (Required) -->
        <div class="config-section">
          <label class="config-label">
            Mouse Button <span class="required">*</span>
          </label>
          <p class="config-description">Choose which mouse button will trigger this action</p>
          
          <div class="button-options">
            <div 
              class="button-option" 
              :class="{ active: selectedMouseButton === 'left' }"
              @click="selectMouseButton('left')"
            >
              <div class="button-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <div class="button-content">
                <h4>Left Click</h4>
                <p>{{ leftClickDescription }}</p>
              </div>
            </div>
            
            <div 
              class="button-option" 
              :class="{ active: selectedMouseButton === 'middle' }"
              @click="selectMouseButton('middle')"
            >
              <div class="button-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v8m0 0l3-3m-3 3l-3-3" />
                </svg>
              </div>
              <div class="button-content">
                <h4>Middle Click</h4>
                <p>{{ middleClickDescription }}</p>
              </div>
            </div>
            
            <div 
              class="button-option" 
              :class="{ active: selectedMouseButton === 'right' }"
              @click="selectMouseButton('right')"
            >
              <div class="button-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </div>
              <div class="button-content">
                <h4>Right Click</h4>
                <p>{{ rightClickDescription }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Modifier Keys Selection (Optional) -->
        <div class="config-section">
          <label class="config-label">
            Modifier Key <span class="optional">(Optional)</span>
          </label>
          <p class="config-description">Hold a key while clicking to trigger the action</p>
          
          <div class="modifier-options">
            <div class="modifier-group">
              <h5>System Keys</h5>
              <div class="modifier-buttons">
                <button 
                  class="modifier-btn" 
                  :class="{ active: selectedModifiers.includes(primaryModifierKey.value) }"
                  @click="toggleModifier(primaryModifierKey.value)"
                >
                  {{ primaryModifierKey.label }}
                </button>
                <button 
                  class="modifier-btn" 
                  :class="{ active: selectedModifiers.includes('shift') }"
                  @click="toggleModifier('shift')"
                >
                  Shift
                </button>
                <button 
                  class="modifier-btn" 
                  :class="{ active: selectedModifiers.includes(altModifierKey.value) }"
                  @click="toggleModifier(altModifierKey.value)"
                >
                  {{ altModifierKey.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Color Selection -->
        <div class="config-section">
          <label class="config-label">
            Selection Box Color <span class="required">*</span>
          </label>
          <p class="config-description">Choose the color for the selection box that will appear when hovering</p>
          
          <div class="color-palette">
            <div 
              v-for="color in colorOptions" 
              :key="color.name"
              class="color-option"
              :class="{ active: selectedColor === color.value }"
              :style="{ backgroundColor: color.value }"
              @click="selectColor(color.value)"
              :title="color.name"
            >
              <svg v-if="selectedColor === color.value" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        
        <!-- Border Configuration -->
        <div class="config-section">
          <label class="config-label">
            Border Style <span class="required">*</span>
          </label>
          <p class="config-description">Configure the border appearance of the selection box</p>
          
          <div class="border-config">
            <div class="border-group">
              <h5>Border Type</h5>
              <div class="border-type-options">
                <button 
                  v-for="borderType in borderTypes" 
                  :key="borderType.value"
                  class="border-type-btn"
                  :class="{ active: selectedBorderType === borderType.value }"
                  @click="selectBorderType(borderType.value)"
                >
                  <div class="border-preview" :style="{ borderStyle: borderType.value, borderWidth: '2px', borderColor: selectedColor || '#667eea' }"></div>
                  <span>{{ borderType.name }}</span>
                </button>
              </div>
            </div>
            
            <div class="border-group">
              <h5>Border Size</h5>
              <div class="border-size-options">
                <button 
                  v-for="size in borderSizes" 
                  :key="size.value"
                  class="border-size-btn"
                  :class="{ active: selectedBorderSize === size.value }"
                  @click="selectBorderSize(size.value)"
                >
                  <div class="size-preview" :style="{ width: size.preview + 'px', height: size.preview + 'px', border: size.value + 'px solid ' + (selectedColor || '#667eea') }"></div>
                  <span>{{ size.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
        
        <!-- Step 2: Action Selection -->
        <div v-if="currentStep === 2">
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
              
              <!-- Options for Open Links in New Tab -->
              <div v-if="selectedAction === 'open_new_tab'" class="advanced-config">
                <div class="option-group">
                  <div class="toggle-option">
                    <label class="toggle-label">
                      <input 
                        type="checkbox" 
                        v-model="smartSelectEnabled"
                        class="toggle-input"
                      >
                      <span class="toggle-slider"></span>
                      <span class="toggle-text">Smart Select</span>
                    </label>
                    <p class="option-description">Removes duplicate URLs when selecting multiple links with the same destination</p>
                  </div>
                  
                  <div class="toggle-option">
                    <label class="toggle-label">
                      <input 
                        type="checkbox" 
                        v-model="reverseOrderEnabled"
                        class="toggle-input"
                      >
                      <span class="toggle-slider"></span>
                      <span class="toggle-text">Open links in reverse order</span>
                    </label>
                    <p class="option-description">Opens links in reverse order of selection</p>
                  </div>
                  
                  <div class="toggle-option">
                    <label class="toggle-label">
                      <input 
                        type="checkbox" 
                        v-model="openAtEndEnabled"
                        class="toggle-input"
                      >
                      <span class="toggle-slider"></span>
                      <span class="toggle-text">Open tabs at the end of opened tabs</span>
                    </label>
                    <p class="option-description">Places new tabs at the end of the tab bar instead of next to current tab</p>
                  </div>
                  
                  <div class="number-option">
                    <label class="number-label">Tab opening delay (seconds)</label>
                    <p class="option-description">Delay between opening each tab to prevent browser overload</p>
                    <div class="number-control">
                      <button 
                        @click="decreaseDelay" 
                        class="number-btn"
                        :disabled="tabOpeningDelay <= 0"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <span class="number-value">{{ tabOpeningDelay.toFixed(1) }}</span>
                      <button 
                        @click="increaseDelay" 
                        class="number-btn"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Options for Open Links in New Window -->
              <div v-if="selectedAction === 'open_new_window'" class="advanced-config">
                <div class="option-group">
                  <div class="toggle-option">
                    <label class="toggle-label">
                      <input 
                        type="checkbox" 
                        v-model="smartSelectEnabledWindow"
                        class="toggle-input"
                      >
                      <span class="toggle-slider"></span>
                      <span class="toggle-text">Smart Select</span>
                    </label>
                    <p class="option-description">Removes duplicate URLs when selecting multiple links with the same destination</p>
                  </div>
                  
                  <div class="toggle-option">
                    <label class="toggle-label">
                      <input 
                        type="checkbox" 
                        v-model="reverseOrderEnabledWindow"
                        class="toggle-input"
                      >
                      <span class="toggle-slider"></span>
                      <span class="toggle-text">Open links in reverse order</span>
                    </label>
                    <p class="option-description">Opens links in reverse order of selection</p>
                  </div>
                  
                  <div class="number-option">
                    <label class="number-label">Tab opening delay (seconds)</label>
                    <p class="option-description">Delay between opening each link in the same new window</p>
                    <div class="number-control">
                      <button 
                        @click="decreaseWindowDelay" 
                        class="number-btn"
                        :disabled="tabOpeningDelayWindow <= 0"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <span class="number-value">{{ tabOpeningDelayWindow.toFixed(1) }}</span>
                      <button 
                        @click="increaseWindowDelay" 
                        class="number-btn"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Options for Copy URLs to Clipboard -->
              <div v-if="selectedAction === 'copy_urls'" class="advanced-config">
                <div class="option-group">
                  <div class="toggle-option">
                    <label class="toggle-label">
                      <input 
                        type="checkbox" 
                        v-model="smartSelectEnabledCopy"
                        class="toggle-input"
                      >
                      <span class="toggle-slider"></span>
                      <span class="toggle-text">Smart Select</span>
                    </label>
                    <p class="option-description">Removes duplicate URLs when selecting multiple links with the same destination</p>
                  </div>
                  
                  <div class="toggle-option">
                    <label class="toggle-label">
                      <input 
                        type="checkbox" 
                        v-model="reverseOrderEnabledCopy"
                        class="toggle-input"
                      >
                      <span class="toggle-slider"></span>
                      <span class="toggle-text">Copy links in reverse order</span>
                    </label>
                    <p class="option-description">Copies links in reverse order of selection</p>
                  </div>
                  
                  <div class="toggle-option">
                    <label class="toggle-label">
                      <input 
                        type="checkbox" 
                        v-model="blankLinesEnabled"
                        class="toggle-input"
                      >
                      <span class="toggle-slider"></span>
                      <span class="toggle-text">Blank lines between links</span>
                    </label>
                    <p class="option-description">Adds blank lines between each copied URL</p>
                    
                    <!-- Number of blank lines control -->
                    <div v-if="blankLinesEnabled" class="number-option" style="margin-top: 1rem;">
                      <label class="number-label">Number of blank lines</label>
                      <p class="option-description">How many blank lines to add between each URL</p>
                      <div class="number-control">
                        <button 
                          @click="decreaseBlankLines" 
                          class="number-btn"
                          :disabled="blankLinesCount <= 0"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                          </svg>
                        </button>
                        <span class="number-value">{{ blankLinesCount }}</span>
                        <button 
                          @click="increaseBlankLines" 
                          class="number-btn"
                          :disabled="blankLinesCount >= 5"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <!-- Example section -->
                    <div v-if="blankLinesEnabled" class="example-section">
                      <div class="example-content">
                        <div class="example-label">Example output:</div>
                        <div class="example-text">
                          https://example1.com<span v-html="'<br>'.repeat(blankLinesCount + 1)"></span>
                          https://example2.com<span v-html="'<br>'.repeat(blankLinesCount + 1)"></span>
                          https://example3.com
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="toggle-option">
                    <label class="toggle-label">
                      <input 
                        type="checkbox" 
                        v-model="excludeDomainsEnabled"
                        class="toggle-input"
                      >
                      <span class="toggle-slider"></span>
                      <span class="toggle-text">Exclude specific domains or URLs</span>
                    </label>
                    <p class="option-description">Exclude certain domains or URLs from being copied</p>
                    
                    <!-- Textarea for excluded domains -->
                    <div v-if="excludeDomainsEnabled" class="textarea-option" style="margin-top: 1rem;">
                      <label class="textarea-label">Domains and URLs to exclude</label>
                      <p class="option-description">Enter domains or URLs to exclude from copying (one per line)</p>
                      <textarea 
                        v-model="excludedDomains"
                        class="exclude-textarea"
                        placeholder="example.com&#10;spam-site.net&#10;https://unwanted-url.com"
                        rows="4"
                      ></textarea>
                      
                      <!-- Example section for excluded domains -->
                      <div v-if="excludedDomains.trim()" class="example-section">
                        <div class="example-content">
                          <div class="example-label">Excluded patterns:</div>
                          <div class="example-text">
                            <div v-for="domain in excludedDomains.split('\n').filter(d => d.trim())" :key="domain" class="excluded-item">
                              {{ domain.trim() }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
          <button @click="closePopup" class="btn-secondary">
            Cancel
          </button>
          <button 
            v-if="currentStep > 1"
            @click="goToPreviousStep" 
            class="btn-secondary"
          >
            Previous
          </button>
          <button 
            @click="proceedToNextStep" 
            class="btn-primary"
            :disabled="!canProceed"
          >
            {{ currentStep === 3 ? 'Create Action' : 'Next Step' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import '../styles/ActionCreationPopup.css';

interface Props {
  isVisible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  nextStep: [config: { mouseButton: string; modifiers: string[]; color: string; borderType: string; borderSize: number; action: string }];
}>();

// State
const currentStep = ref<number>(1);
const selectedMouseButton = ref<string>('');
const selectedModifiers = ref<string[]>([]);
const selectedColor = ref<string>('#667eea');
const selectedBorderType = ref<string>('solid');
const selectedBorderSize = ref<number>(2);
const selectedAction = ref<string>('');

// Advanced options state
const smartSelectEnabled = ref<boolean>(true);
const reverseOrderEnabled = ref<boolean>(false);
const openAtEndEnabled = ref<boolean>(false);
const tabOpeningDelay = ref<number>(0.5);
const advancedOptionsRef = ref<HTMLElement | null>(null);

// Advanced options for Open Links in New Window
const smartSelectEnabledWindow = ref<boolean>(true);
const reverseOrderEnabledWindow = ref<boolean>(false);
const tabOpeningDelayWindow = ref<number>(0.5);

// Advanced options for Copy URLs to Clipboard
const smartSelectEnabledCopy = ref<boolean>(true);
const reverseOrderEnabledCopy = ref<boolean>(false);
const blankLinesEnabled = ref<boolean>(false);
const blankLinesCount = ref<number>(0);
const excludeDomainsEnabled = ref<boolean>(false);
const excludedDomains = ref<string>('');

// Platform detection for cross-platform compatibility
const isMac = computed(() => {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
});

const isLinux = computed(() => {
  return typeof navigator !== 'undefined' && /Linux/.test(navigator.platform);
});

// Cross-platform modifier keys
const primaryModifierKey = computed(() => {
  if (isMac.value) {
    return { value: 'meta', label: 'Cmd' }; // Command key on Mac
  }
  return { value: 'ctrl', label: 'Ctrl' }; // Ctrl key on Windows/Linux
});

const altModifierKey = computed(() => {
  if (isMac.value) {
    return { value: 'alt', label: 'Option' }; // Option key on Mac
  }
  return { value: 'alt', label: 'Alt' }; // Alt key on Windows/Linux
});

// Cross-platform mouse button descriptions
const leftClickDescription = computed(() => {
  if (isMac.value) {
    return 'Primary click';
  }
  return 'Primary button';
});

const middleClickDescription = computed(() => {
  if (isMac.value) {
    return 'Scroll wheel / Force Touch';
  }
  return 'Scroll wheel';
});

const rightClickDescription = computed(() => {
  if (isMac.value) {
    return 'Secondary click / Control+click';
  }
  return 'Context menu';
});

// Data
const colorOptions = [
  { name: 'Blue', value: '#667eea' },
  { name: 'Purple', value: '#764ba2' },
  { name: 'Green', value: '#56ab2f' },
  { name: 'Orange', value: '#f093fb' },
  { name: 'Red', value: '#ff6b6b' },
  { name: 'Teal', value: '#4ecdc4' },
  { name: 'Pink', value: '#ff9a9e' },
  { name: 'Yellow', value: '#ffeaa7' },
  { name: 'Indigo', value: '#6c5ce7' },
  { name: 'Cyan', value: '#74b9ff' },
  { name: 'Lime', value: '#00b894' },
  { name: 'Amber', value: '#fdcb6e' }
];

const borderTypes = [
  { name: 'Solid', value: 'solid' },
  { name: 'Dashed', value: 'dashed' },
  { name: 'Dotted', value: 'dotted' },
  { name: 'Double', value: 'double' }
];

const borderSizes = [
  { name: 'Thin', value: 1, preview: 16 },
  { name: 'Medium', value: 2, preview: 18 },
  { name: 'Thick', value: 3, preview: 20 },
  { name: 'Extra Thick', value: 4, preview: 22 }
];

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

// Computed
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return selectedMouseButton.value && selectedColor.value && selectedBorderType.value && selectedBorderSize.value;
  } else if (currentStep.value === 2) {
    return selectedAction.value;
  }
  return false;
});

// Methods
const closePopup = () => {
  emit('close');
};

const selectMouseButton = (button: string) => {
  selectedMouseButton.value = button;
};

const toggleModifier = (modifier: string) => {
  const index = selectedModifiers.value.indexOf(modifier);
  if (index > -1) {
    selectedModifiers.value.splice(index, 1);
  } else {
    // Only allow one modifier at a time for simplicity
    selectedModifiers.value = [modifier];
  }
};

const selectColor = (color: string) => {
  selectedColor.value = color;
};

const selectBorderType = (type: string) => {
  selectedBorderType.value = type;
};

const selectBorderSize = (size: number) => {
  selectedBorderSize.value = size;
};

const selectAction = (action: string) => {
  selectedAction.value = action;
  
  // Smooth scroll to advanced options after a short delay
  if (action) {
    setTimeout(() => {
      if (advancedOptionsRef.value) {
        advancedOptionsRef.value.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  }
};

const increaseDelay = () => {
  tabOpeningDelay.value = Math.min(tabOpeningDelay.value + 0.5, 10);
};

const decreaseDelay = () => {
  tabOpeningDelay.value = Math.max(tabOpeningDelay.value - 0.5, 0);
};

const increaseWindowDelay = () => {
  tabOpeningDelayWindow.value = Math.min(tabOpeningDelayWindow.value + 0.5, 10);
};

const decreaseWindowDelay = () => {
  tabOpeningDelayWindow.value = Math.max(tabOpeningDelayWindow.value - 0.5, 0);
};

const increaseBlankLines = () => {
  blankLinesCount.value = Math.min(blankLinesCount.value + 1, 5);
};

const decreaseBlankLines = () => {
  blankLinesCount.value = Math.max(blankLinesCount.value - 1, 0);
};

const goToPreviousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
    // Scroll popup to top when going to previous step
    const popupContainer = document.querySelector('.popup-container');
    if (popupContainer) {
      popupContainer.scrollTop = 0;
    }
  }
};

const proceedToNextStep = () => {
  if (canProceed.value) {
    if (currentStep.value < 3) {
      currentStep.value++;
      // Scroll popup to top when proceeding to next step
      const popupContainer = document.querySelector('.popup-container');
      if (popupContainer) {
        popupContainer.scrollTop = 0;
      }
    } else {
      // Final step - emit the complete configuration
      emit('nextStep', {
        mouseButton: selectedMouseButton.value,
        modifiers: selectedModifiers.value,
        color: selectedColor.value,
        borderType: selectedBorderType.value,
        borderSize: selectedBorderSize.value,
        action: selectedAction.value
      });
    }
  }
};
</script>

<style scoped>
/* Component-specific styles are imported from ActionCreationPopup.css */
</style>