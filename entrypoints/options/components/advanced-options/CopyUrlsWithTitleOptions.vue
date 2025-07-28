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
        <p class="option-description">Copies URLs with titles in reverse order of selection</p>
      </div>
      
      <div class="format-pattern-section">
        <label class="section-label">Format Pattern</label>
        <div class="format-pattern-buttons">
          <button 
            v-for="pattern in formatPatterns"
            :key="pattern.value"
            @click="selectFormatPattern(pattern.value)"
            :class="['format-pattern-btn', { 'active': options.formatPattern === pattern.value }]"
          >
            {{ pattern.label }}
          </button>
        </div>
      </div>
      
      <div class="separator-section" v-if="!['markdown', 'html', 'json'].includes(options.formatPattern || 'title_url')">
        <label class="section-label">Separator Type</label>
        <div class="separator-type-buttons">
          <button 
            v-for="separator in separatorTypes"
            :key="separator.value"
            @click="selectSeparatorType(separator.value)"
            :class="['separator-type-btn', { 'active': options.separatorType === separator.value }]"
          >
            {{ separator.label }}
          </button>
        </div>
        
        <div class="controls-row">
          <div class="separator-count-section">
            <label class="number-label">Separator Count</label>
            <div class="number-control">
              <button 
                @click="decreaseSeparatorCount" 
                class="number-btn"
                :disabled="(options.separatorCount || 1) <= 1"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </button>
              <span class="number-value">{{ options.separatorCount || 1 }}</span>
              <button 
                @click="increaseSeparatorCount" 
                class="number-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="newlines-section" v-if="!['markdown', 'html', 'json'].includes(options.formatPattern || 'title_url')">
            <label class="number-label">New Lines Between Entries</label>
            <div class="number-control">
              <button 
                @click="decreaseNewLinesCount" 
                class="number-btn"
                :disabled="(options.newLinesCount || 0) <= 0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </button>
              <span class="number-value">{{ options.newLinesCount || 0 }}</span>
              <button 
                @click="increaseNewLinesCount" 
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
      
      <div class="example-output-section">
        <label class="section-label">Example Output</label>
        <div class="example-output">
          <pre>{{ getExampleOutput() }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue';
interface Props {
  options: {
    smartSelectEnabled?: boolean;
    reverseOrderEnabled?: boolean;
    formatPattern?: string;
    separatorType?: string;
    separatorCount?: number;
    newLinesCount?: number;
  };
}

interface Emits {
  update: [options: Record<string, any>];
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({
    smartSelectEnabled: true,
    reverseOrderEnabled: false,
    formatPattern: 'title_url',
    separatorType: 'space',
    separatorCount: 1,
    newLinesCount: 0
  })
});

const emit = defineEmits<Emits>();

const formatPatterns = [
  { value: 'title_url', label: 'Title - URL' },
  { value: 'url_title', label: 'URL - Title' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML Links' },
  { value: 'json', label: 'JSON Format' }
];

const separatorTypes = [
  { value: 'space', label: 'Space' },
  { value: 'dash', label: 'Dash' },
  { value: 'pipe', label: 'Pipe' },
  { value: 'colon', label: 'Colon' },
  { value: 'tab', label: 'Tab' }
];

const updateOption = (key: string, value: any) => {
  emit('update', {
    ...props.options,
    [key]: value
  });
};

const selectFormatPattern = (pattern: string) => {
  // First update the format pattern
  updateOption('formatPattern', pattern);
  
  // Then reset other settings based on the new format
   nextTick(() => {
     if (['markdown', 'html', 'json'].includes(pattern)) {
       updateOption('separatorType', 'space');
       updateOption('separatorCount', 1);
       updateOption('newLinesCount', 0);
     }
   });
};

const selectSeparatorType = (type: string) => {
  updateOption('separatorType', type);
};

const increaseSeparatorCount = () => {
  const newCount = Math.min((props.options.separatorCount || 1) + 1, 10);
  updateOption('separatorCount', newCount);
};

const decreaseSeparatorCount = () => {
  const newCount = Math.max((props.options.separatorCount || 1) - 1, 1);
  updateOption('separatorCount', newCount);
};

const increaseNewLinesCount = () => {
  const newCount = Math.min((props.options.newLinesCount || 0) + 1, 5);
  updateOption('newLinesCount', newCount);
};

const decreaseNewLinesCount = () => {
  const newCount = Math.max((props.options.newLinesCount || 0) - 1, 0);
  updateOption('newLinesCount', newCount);
};

const getSeparatorExample = () => {
  const separatorMap: Record<string, string> = {
    space: ' ',
    dash: '-',
    pipe: '|',
    colon: ':',
    tab: '\t'
  };
  
  const separator = separatorMap[props.options.separatorType || 'space'];
  return separator.repeat(props.options.separatorCount || 1);
};

const getExampleOutput = () => {
  const exampleData = [
    { title: 'Example Title 1', url: 'https://example1.com' },
    { title: 'Example Title 2', url: 'https://example2.com' }
  ];
  
  let data = [...exampleData];
  
  // Apply reverse order if enabled
  if (props.options.reverseOrderEnabled) {
    data = data.reverse();
  }
  
  // Simulate smart select (remove duplicates)
  if (props.options.smartSelectEnabled) {
    const seen = new Set();
    data = data.filter(item => {
      const key = item.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  const separator = getSeparatorExample();
  
  const formatEntry = (item: { title: string; url: string }) => {
    switch (props.options.formatPattern) {
      case 'title_url':
        return `${item.title}${separator}${item.url}`;
      case 'url_title':
        return `${item.url}${separator}${item.title}`;
      case 'markdown':
        return `[${item.title}](${item.url})`;
      case 'html':
        return `<a href="${item.url}">${item.title}</a>`;
      case 'json':
        return JSON.stringify({ url: item.url, title: item.title });
      default:
        return `${item.title}${separator}${item.url}`;
    }
  };
  
  // Handle JSON format specially
  if (props.options.formatPattern === 'json') {
    const urlsArray = data.map(item => ({ url: item.url, title: item.title }));
    return JSON.stringify({ urls: urlsArray }, null, 2);
  }
  
  const formattedEntries = data.map(formatEntry);
  const newLines = '\n'.repeat((props.options.newLinesCount || 0) + 1);
  
  return formattedEntries.join(newLines);
};
</script>