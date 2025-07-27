<script lang="ts" setup>
import { defineEmits } from 'vue';
import '../styles/GrabbitOptions.css';

const emit = defineEmits<{
  goBack: [];
}>();

// Handle add new action
const addNewAction = () => {
  console.log('Add new action clicked');
  // TODO: Implement add action functionality
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
    <div class="actions-container">
      <!-- Empty State -->
      <div class="empty-state">
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
  </div>
</template>

<style scoped>
/* Component-specific styles are imported from GrabbitOptions.css */
</style>