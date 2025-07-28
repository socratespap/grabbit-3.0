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
import StepIndicator from './steps/StepIndicator.vue';
import ActivationKeysStep from './steps/ActivationKeysStep.vue';
import ActionSelectionStep from './steps/ActionSelectionStep.vue';
import '../styles/ActionCreationPopup.css';

interface Props {
  isVisible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  nextStep: [config: { mouseButton: string; modifiers: string[]; color: string; borderType: string; borderSize: number; action: string; advancedOptions: any }];
}>();

// State
const currentStep = ref<number>(1);
const selectedMouseButton = ref<string>('');
const selectedModifiers = ref<string[]>([]);
const selectedColor = ref<string>('#667eea');
const selectedBorderType = ref<string>('solid');
const selectedBorderSize = ref<number>(2);
const selectedAction = ref<string>('');
const advancedOptions = ref<any>({});



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