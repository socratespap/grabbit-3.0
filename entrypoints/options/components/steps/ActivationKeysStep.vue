<template>
  <div>
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
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  selectedMouseButton: string;
  selectedModifiers: string[];
  selectedColor: string;
  selectedBorderType: string;
  selectedBorderSize: number;
}

interface Emits {
  'update:mouse-button': [button: string];
  'update:modifiers': [modifiers: string[]];
  'update:color': [color: string];
  'update:border-type': [type: string];
  'update:border-size': [size: number];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Platform detection for cross-platform compatibility
const isMac = computed(() => {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
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

// Methods
const selectMouseButton = (button: string) => {
  emit('update:mouse-button', button);
};

const toggleModifier = (modifier: string) => {
  const currentModifiers = [...props.selectedModifiers];
  const index = currentModifiers.indexOf(modifier);
  if (index > -1) {
    currentModifiers.splice(index, 1);
  } else {
    currentModifiers.push(modifier);
  }
  emit('update:modifiers', currentModifiers);
};

const selectColor = (color: string) => {
  emit('update:color', color);
};

const selectBorderType = (type: string) => {
  emit('update:border-type', type);
};

const selectBorderSize = (size: number) => {
  emit('update:border-size', size);
};
</script>