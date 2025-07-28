<template>
  <div v-if="isVisible" class="popup-overlay" @click="closePopup">
    <div class="popup-container" @click.stop>
      <div class="popup-header">
        <h2 class="popup-title">{{ props.isEditing ? 'Edit Action' : 'Create New Action' }} - Step {{ currentStep }}</h2>
        <button @click="closePopup" class="close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="popup-content">
        <StepIndicator :current-step="currentStep" />
        
        <!-- Step 1: Activation Keys Configuration -->
        <ActivationKeysStep 
          v-if="currentStep === 1"
          :selected-mouse-button="selectedMouseButton"
          :selected-modifiers="selectedModifiers"
          :selected-color="selectedColor"
          :selected-border-type="selectedBorderType"
          :selected-border-size="selectedBorderSize"
          @update:mouse-button="selectedMouseButton = $event"
          @update:modifiers="selectedModifiers = $event"
          @update:color="selectedColor = $event"
          @update:border-type="selectedBorderType = $event"
          @update:border-size="selectedBorderSize = $event"
        />
        
        <!-- Step 2: Action Selection -->
        <ActionSelectionStep 
          v-if="currentStep === 2"
          :selected-action="selectedAction"
          :advanced-options="advancedOptions"
          @update:action="selectedAction = $event"
          @update:advanced-options="handleAdvancedOptionsUpdate"
        />
        
        <!-- Step 3: Review Configuration -->
        <ReviewStep 
          v-if="currentStep === 3"
          :selected-mouse-button="selectedMouseButton"
          :selected-modifiers="selectedModifiers"
          :selected-color="selectedColor"
          :selected-border-type="selectedBorderType"
          :selected-border-size="selectedBorderSize"
          :selected-action="selectedAction"
          :advanced-options="advancedOptions"
        />
        
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
            {{ currentStep === 3 ? (props.isEditing ? 'Update Action' : 'Create Action') : 'Next Step' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import StepIndicator from './steps/StepIndicator.vue';
import ActivationKeysStep from './steps/ActivationKeysStep.vue';
import ActionSelectionStep from './steps/ActionSelectionStep.vue';
import ReviewStep from './steps/ReviewStep.vue';
import '../styles/ActionCreationPopup.css';

interface Props {
  isVisible: boolean;
  initialData?: {
    mouseButton: string;
    modifiers: string[];
    color: string;
    borderType: string;
    borderSize: number;
    action: string;
    advancedOptions: any;
  };
  isEditing?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  nextStep: [config: { mouseButton: string; modifiers: string[]; color: string; borderType: string; borderSize: number; action: string; advancedOptions: any }];
}>();

// State
const currentStep = ref<number>(1);
const selectedMouseButton = ref<string>(props.initialData?.mouseButton || '');
const selectedModifiers = ref<string[]>(props.initialData?.modifiers || []);
const selectedColor = ref<string>(props.initialData?.color || '#667eea');
const selectedBorderType = ref<string>(props.initialData?.borderType || 'solid');
const selectedBorderSize = ref<number>(props.initialData?.borderSize || 2);
const selectedAction = ref<string>(props.initialData?.action || '');
const advancedOptions = ref<any>(props.initialData?.advancedOptions || {});

// Watch for popup visibility changes to reset form when creating new action
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    currentStep.value = 1;
    if (!props.isEditing) {
      // Reset form for new action
      selectedMouseButton.value = '';
      selectedModifiers.value = [];
      selectedColor.value = '#667eea';
      selectedBorderType.value = 'solid';
      selectedBorderSize.value = 2;
      selectedAction.value = '';
      advancedOptions.value = {};
    } else if (props.initialData) {
      // Pre-fill form for editing
      selectedMouseButton.value = props.initialData.mouseButton;
      selectedModifiers.value = props.initialData.modifiers;
      selectedColor.value = props.initialData.color;
      selectedBorderType.value = props.initialData.borderType;
      selectedBorderSize.value = props.initialData.borderSize;
      selectedAction.value = props.initialData.action;
      advancedOptions.value = props.initialData.advancedOptions;
    }
  }
});

// Computed
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return selectedMouseButton.value && selectedColor.value && selectedBorderType.value && selectedBorderSize.value;
  } else if (currentStep.value === 2) {
    return selectedAction.value;
  } else if (currentStep.value === 3) {
    return true; // All validation is done in previous steps
  }
  return false;
});

// Methods
const closePopup = () => {
  emit('close');
};

// Event handlers for child components
const handleActivationKeysUpdate = (data: any) => {
  selectedMouseButton.value = data.mouseButton;
  selectedModifiers.value = data.modifiers;
  selectedColor.value = data.color;
  selectedBorderType.value = data.borderType;
  selectedBorderSize.value = data.borderSize;
};

const handleActionSelectionUpdate = (action: string) => {
  selectedAction.value = action;
};

const handleAdvancedOptionsUpdate = (options: any) => {
  advancedOptions.value = options;
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
        action: selectedAction.value,
        advancedOptions: advancedOptions.value
      });
    }
  }
};
</script>

<style scoped>
/* Component-specific styles are imported from ActionCreationPopup.css */
</style>