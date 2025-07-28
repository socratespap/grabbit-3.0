<template>
  <div class="advanced-config">
    <div class="option-group">
      <div class="toggle-option">
        <label class="toggle-label">
          <input 
            type="checkbox" 
            :checked="options.smartSelectEnabled"
            @change="updateOption('smartSelectEnabled', ($event.target as HTMLInputElement)?.checked)"
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
            :checked="options.reverseOrderEnabled"
            @change="updateOption('reverseOrderEnabled', ($event.target as HTMLInputElement)?.checked)"
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
            @click="decreaseDelay" 
            class="number-btn"
            :disabled="(options.tabOpeningDelay || 0) <= 0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </button>
          <span class="number-value">{{ options.tabOpeningDelay?.toFixed(1) || '0.0' }}</span>
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
</template>

<script setup lang="ts">
interface Props {
  options: {
    smartSelectEnabled?: boolean;
    reverseOrderEnabled?: boolean;
    tabOpeningDelay?: number;
  };
}

interface Emits {
  update: [options: Record<string, any>];
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({
    smartSelectEnabled: true,
    reverseOrderEnabled: false,
    tabOpeningDelay: 0.0
  })
});

const emit = defineEmits<Emits>();

const updateOption = (key: string, value: any) => {
  emit('update', {
    ...props.options,
    [key]: value
  });
};

const increaseDelay = () => {
  const newDelay = Math.min((props.options.tabOpeningDelay || 0.5) + 0.5, 10);
  updateOption('tabOpeningDelay', newDelay);
};

const decreaseDelay = () => {
  const newDelay = Math.max((props.options.tabOpeningDelay || 0.5) - 0.5, 0);
  updateOption('tabOpeningDelay', newDelay);
};
</script>