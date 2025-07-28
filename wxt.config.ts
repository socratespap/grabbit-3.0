import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    permissions: ['tabs', 'scripting', 'storage', 'activeTab'],
    options_ui: {
      page: 'options.html',
      open_in_tab: true
    }
  }
});
