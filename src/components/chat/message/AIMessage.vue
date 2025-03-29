<template>
  <div class="flex justify-start">
    <!-- AI头像 -->
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mr-3 mt-1 relative overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" :class="'animate-pulse'"></div>
      <LeafIcon class="h-4 w-4 text-white" />
    </div>
    
    <!-- 消息气泡 -->
    <div class="max-w-[80%] bg-white text-gray-800 border border-green-100 rounded-2xl rounded-tl-sm shadow-md">
      <!-- 思考过程展示 -->
      <div v-if="hasThinking" class="border-b border-green-100">
        <div 
          class="px-5 py-2 text-gray-500 text-xs flex items-center cursor-pointer hover:bg-green-50 transition-colors duration-200"
          @click="toggleThinking"
        >
          <ChevronDownIcon v-if="!showThinking" class="h-3 w-3 mr-1" />
          <ChevronUpIcon v-else class="h-3 w-3 mr-1" />
          <BrainIcon class="h-3 w-3 mr-1 text-gray-400" />
          <span class="font-medium">AI思考过程</span>
          <span class="ml-1 text-gray-400">({{ thinkingDuration }}s)</span>
        </div>
        <div 
          v-show="showThinking" 
          class="px-5 py-3 text-xs text-gray-500 bg-gray-50 overflow-auto transition-all duration-300 ease-in-out"
          style="max-height: 300px;"
        >
          <div class="border-l-2 border-gray-300 pl-3">
            <div class="text-gray-400 italic mb-2">以下是AI的思考过程，非最终回答：</div>
            <div class="markdown-content" v-html="renderedThinking"></div>
          </div>
        </div>
      </div>
      
      <!-- 消息内容 -->
      <div class="px-5 py-4">
        <div class="text-sm markdown-content ai-message-content" v-html="renderedContent"></div>
      </div>
      
      <!-- 消息底部 -->
      <div class="flex items-center justify-between px-5 py-2 border-t border-green-100">
        <div class="flex items-center">
          <ClockIcon class="h-3 w-3 text-green-500" />
          <span class="text-xs ml-1 text-gray-500">
            {{ formatTime(message.timestamp) }}
          </span>
          
          <!-- 引用文档按钮 -->
          <button 
            v-if="message.hasReferences"
            class="ml-2 flex items-center text-green-500 hover:text-green-600 transform transition-transform duration-200 hover:scale-110"
            @click="$emit('toggle-references', message.id)"
          >
            <FileTextIcon class="h-3 w-3" />
            <span v-if="message.referencesCount" class="ml-1 text-xs">
              {{ message.referencesCount }}
            </span>
          </button>
        </div>
        
        <div class="flex items-center space-x-1">
          <!-- AI徽章 -->
          <div class="relative">
            <div class="absolute -inset-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full blur-[2px] opacity-70 animate-pulse"></div>
            <div class="relative flex items-center bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-full px-2 h-4">
              <SparklesIcon class="h-2.5 w-2.5 mr-0.5 text-green-600" />
              <span class="text-[10px] font-medium">AI</span>
            </div>
          </div>
          
          <!-- 反馈按钮 -->
          <FeedbackButtons 
            :feedback="message.feedback" 
            @feedback="(type) => $emit('feedback', message.id, type)" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import { 
  Leaf as LeafIcon,
  Clock as ClockIcon,
  FileText as FileTextIcon,
  Sparkles as SparklesIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Brain as BrainIcon
} from 'lucide-vue-next';
import FeedbackButtons from './FeedbackButtons.vue';
import { useMarkdownRenderer } from '../../../composables/useMarkdownRenderer';

export default {
  name: 'AIMessage',
  components: {
    LeafIcon,
    ClockIcon,
    FileTextIcon,
    SparklesIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    FeedbackButtons,
    BrainIcon
  },
  props: {
    message: {
      type: Object,
      required: true
    },
    isReferenceShowing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-references', 'feedback'],
  setup(props) {
    const { renderMarkdown } = useMarkdownRenderer();
    const showThinking = ref(false);
    
    // 提取思考内容和正式内容
    const thinkingContent = computed(() => {
      const thinkMatch = props.message.content.match(/<think>([\s\S]*?)<\/think>/);
      return thinkMatch ? thinkMatch[1].trim() : '';
    });
    
    const actualContent = computed(() => {
      return props.message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    });
    
    // 是否有思考内容
    const hasThinking = computed(() => {
      return thinkingContent.value.length > 0;
    });
    
    // 渲染Markdown内容
    const renderedContent = computed(() => {
      return renderMarkdown(actualContent.value);
    });
    
    const renderedThinking = computed(() => {
      return renderMarkdown(thinkingContent.value);
    });
    
    // 模拟的思考时间（实际应用中可能需要从后端获取）
    const thinkingDuration = computed(() => {
      // 根据思考内容长度计算模拟时间，实际使用时可从后端获取真实值
      return (thinkingContent.value.length / 100).toFixed(1);
    });
    
    // 切换思考内容显示状态
    const toggleThinking = () => {
      showThinking.value = !showThinking.value;
    };
    
    return {
      renderedContent,
      renderedThinking,
      hasThinking,
      showThinking,
      thinkingContent,
      thinkingDuration,
      toggleThinking
    };
  },
  methods: {
    formatTime(timestamp) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}
</script>

<style scoped>
/* AI消息容器的样式可在此添加 */
.ai-message-content {
  min-height: 20px;
}

.ai-message-content :deep(*) {
  opacity: 1;
}

/* 思考内容样式 */
.markdown-content :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.markdown-content :deep(ul), 
.markdown-content :deep(ol) {
  margin-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25rem;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

/* 移除所有打字机动画和渐变效果 */

/* 代码块样式，但无动画 */
.ai-message-content :deep(pre) {
  border: 1px solid rgba(226, 232, 240, 1);
  border-radius: 0.375rem;
  background-color: rgba(240, 247, 240, 1);
}

.ai-message-content :deep(code:not(pre code)) {
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.9em;
  color: #2e7d32;
  background-color: rgba(240, 247, 240, 1);
}

.ai-message-content :deep(pre code) {
  background: transparent;
}

/* 链接和代码高亮有下划线动画 - 保留交互效果但移除渐变 */
.ai-message-content :deep(a), 
.ai-message-content :deep(code) {
  position: relative;
  transition: all 0.3s ease;
}

.ai-message-content :deep(a::after), 
.ai-message-content :deep(code::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background: currentColor;
  transition: width 0.3s ease;
}

.ai-message-content :deep(a:hover::after),
.ai-message-content :deep(code:hover::after) {
  width: 100%;
}
</style> 