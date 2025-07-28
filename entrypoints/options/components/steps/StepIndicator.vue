<template>
  <div class="step-indicator">
    <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">1</div>
    <div class="step-line" :class="{ completed: currentStep > 1 }"></div>
    <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">2</div>
    <div class="step-line" :class="{ completed: currentStep > 2 }"></div>
    <div class="step" :class="{ active: currentStep === 3 }">3</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentStep: number;
}

defineProps<Props>();
</script>

<style scoped>
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.step {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  background-color: #e5e7eb;
  color: #6b7280;
  transition: all 0.3s ease;
}

.step.active {
  background-color: #667eea;
  color: white;
  transform: scale(1.1);
}

.step.completed {
  background-color: #10b981;
  color: white;
}

.step-line {
  width: 60px;
  height: 2px;
  background-color: #e5e7eb;
  transition: all 0.3s ease;
}

.step-line.completed {
  background-color: #10b981;
}
</style>