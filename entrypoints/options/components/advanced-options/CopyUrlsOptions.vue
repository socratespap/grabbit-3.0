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
          <span class="toggle-text">Copy in reverse order</span>
        </label>
        <p class="option-description">Copies URLs in reverse order of selection</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  options: {
    smartSelectEnabled?: boolean;
    reverseOrderEnabled?: boolean;
  };
}

interface Emits {
  update: [options: Record<string, any>];
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({
    smartSelectEnabled: true,
    reverseOrderEnabled: false
  })
});

const emit = defineEmits<Emits>();

const updateOption = (key: string, value: any) => {
  emit('update', {
    ...props.options,
    [key]: value
  });
};
</script>