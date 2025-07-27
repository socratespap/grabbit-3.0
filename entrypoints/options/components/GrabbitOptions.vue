<script lang="ts" setup>
import { defineEmits } from 'vue';

const emit = defineEmits<{
  goBack: [];
}>();
</script>

<template>
  <div class="grabbit-options">
    <div class="placeholder-content">
      <div class="placeholder-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h2 class="placeholder-title">Grabbit Core Settings</h2>
      <p class="placeholder-description">
        Core Grabbit settings will be available in a future update. This section will include advanced configuration options for the extension's core functionality.
      </p>
      <div class="coming-soon-badge">
        <span>Coming Soon</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grabbit-options {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.placeholder-content {
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.placeholder-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  opacity: 0.6;
  color: rgba(255, 255, 255, 0.7);
}

.placeholder-icon svg {
  width: 100%;
  height: 100%;
}

.placeholder-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: white;
}

.placeholder-description {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.coming-soon-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 20px;
  color: #ffc107;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .placeholder-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 20px;
  }
  
  .placeholder-title {
    font-size: 24px;
  }
  
  .placeholder-description {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .grabbit-options {
    padding: 20px 16px;
    min-height: 300px;
  }
  
  .placeholder-icon {
    width: 50px;
    height: 50px;
    margin-bottom: 16px;
  }
  
  .placeholder-title {
    font-size: 20px;
  }
  
  .placeholder-description {
    font-size: 13px;
  }
  
  .coming-soon-badge {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>